module glue;
import ldc.attributes;
import std.typecons;
import std.exception;
import std.traits;
import std.conv;

private extern (C) @llvmAttr("wasm-import-module", "glue") {
	void setBool(int slot, bool value);
	void setDouble(int slot, double value);
	bool getBool(int slot);
	bool castBool(int slot);
	double getDouble(int slot);
	void setString(int slot, const(void)* ptr, size_t len);
	void setBuffer(int slot, const(void)* ptr, size_t len);
	void setDelegate(int slot, int value);
	void setGlobal(int slot);
	size_t getBufferLength(int slot);
	void getBuffer(int slot, void* ptr);
	size_t getArrayLength(int slot);
	void getArrayIndex(int slot, size_t index);
	void toEncodedString(int slot);
	void copy(int slot, int fromSlot);
	void undefine(int slot);
	void makeArray(int slot);
	void push(int slot, uint valueSlot);
	void getIndex(int slot, int keySlot);
	void setIndex(int slot, int valueSlot, int keySlot);
	void opTypeof(int slot);
	bool opInstanceof(int slot, int otherSlot);
	void opCall(int slot, void* ptr, int numArgs);
	void opNew(int slot, void* ptr, int numArgs);
	void opDispatch(int slot, const(void)* member, size_t mlen, void* ptr, int numArgs);
	void debugInfo(const(void)* ptr, size_t len, size_t line);
	bool checkEquals(int slot, int otherSlot);
}

private extern (C) @assumeUsed {
	pragma(mangle, "reserveSlots")
	int reserveSlots(int numSlots) {
		int startSlot = var.nextSlot;
		foreach (i; 0 .. numSlots - 1) {
			var.nextSlot;
		}
		return startSlot;
	}

	pragma(mangle, "callDelegate")
	void callDelegate(int id, int startSlot, int numArgs) {
		var[] args = new var[numArgs];
		foreach (i; 0 .. numArgs) {
			args[i].slot = startSlot + 1 + i;
		}
		var result = delegates[id](args);
		copy(startSlot, result.slot);
	}

	pragma(mangle, "deleteDelegate")
	void deleteDelegate(int id) {
		delegates.remove(id);
	}
}

private extern (C) int rt_init();

static this() {
	// we init the runtime an extra time, without ever de-initing it, so that the runtime lives forever
	// this way, we can call back from JS into D at any time, even after the main function has finished
	rt_init();
}

private struct GCed(T) {
	private T* t_;
	private static const(T) constUninit;

	this(Args...)(Args args) {
		t_ = new T(args);
	}

	ref T t() {
		if (t_ == null) t_ = new T();
		return *t_;
	}

	ref const(T) t() const {
		if (t_ == null) return constUninit;
		return *t_;
	}

	alias t this;
}

alias var = GCed!VarImpl;

private void ddebugInfo(string file, size_t line)() {
	debug {
		debugInfo(file.ptr, file.length, line);
	}
}

private alias DelegateBackend = var delegate(var[] args);
private DelegateBackend[int] delegates;
private int currentDelegate;

private struct VarImpl {
private:

	public int slot = -1;

	static int currentSlot;

	static int nextSlot() {
		currentSlot += 1;
		return currentSlot;
	}

public:

	static var Null() { // @suppress(dscanner.style.phobos_naming_convention)
		var result;
		result.slot = 0;
		return result;
	}

	var clone() const {
		var result;
		result.slot = nextSlot;
		copy(result.slot, slot);
		return result;
	}

	this(var v) {
		slot = nextSlot;
		copy(slot, v.slot);
	}

	this(bool value) {
		slot = nextSlot;
		setBool(slot, value);
	}

	this(byte value) {
		this(cast(double) value);
	}

	this(ubyte value) {
		this(cast(double) value);
	}

	this(short value) {
		this(cast(double) value);
	}

	this(ushort value) {
		this(cast(double) value);
	}

	this(int value) {
		this(cast(double) value);
	}

	this(uint value) {
		this(cast(double) value);
	}

	this(float value) {
		this(cast(double) value);
	}

	this(double value) {
		slot = nextSlot;
		setDouble(slot, value);
	}

	this(string value) {
		slot = nextSlot;
		setString(slot, value.ptr, value.length);
	}

	this(T)(T[] value) {
		slot = nextSlot;
		static if (is(Unqual!T == void) || is(Unqual!T == ubyte)) {
			setBuffer(slot, value.ptr, value.length);
		}
		else {
			makeArray(slot);
			foreach (v; value) {
				var v2 = var(v);
				push(slot, v2.slot);
			}
		}
	}

	this(Callable)(Callable value) if (isCallable!Callable) {
		alias Args = Parameters!Callable;
		alias T = ReturnType!Callable;
		slot = nextSlot;
		currentDelegate += 1;
		int id = currentDelegate;
		delegates[id] = delegate var(var[] args) {
			if (args.length < Args.length)
				args.length = Args.length;
			Args dargs;
			static foreach (i, Arg; Args) {
				dargs[i] = args[i].get!Arg;
			}
			static if (is(Unqual!T == void)) {
				value(dargs);
				return var.init;
			}
			else {
				return var(value(dargs));
			}
		};
		setDelegate(slot, id);
	}

	~this() {
		import std.stdio : writeln;

		// writeln("undefine ", slot);
		undefine(slot);
	}

	bool equals(var other) const {
		return checkEquals(slot, other.slot);
	}

	inout(var) opIndex(T, string file = __FILE__, size_t line = __LINE__)(T key) inout {
		ddebugInfo!(file, line);
		var result = clone;
		var keyv = var(key);
		getIndex(result.slot, keyv.slot);
		return cast(inout(var)) result;
	}

	var opIndexAssign(T, K, string file = __FILE__, size_t line = __LINE__)(T value, K key) {
		ddebugInfo!(file, line);
		var keyv = key;
		var valuev = value;
		setIndex(slot, valuev.slot, keyv.slot);
		return valuev;
	}

	var opCall(string file = __FILE__, size_t line = __LINE__, Args...)(Args args) const {
		ddebugInfo!(file, line);
		var[Args.length] argsv;
		int[Args.length] argsi;
		foreach (i, arg; args) {
			argsv[i] = var(arg);
			argsi[i] = argsv[i].slot;
		}
		var result = clone;
		.opCall(result.slot, argsi.ptr, cast(int) Args.length);
		return result;
	}

	var New(string file = __FILE__, size_t line = __LINE__, Args...)(Args args) const { // @suppress(dscanner.style.phobos_naming_convention)
		ddebugInfo!(file, line);
		var[Args.length] argsv;
		int[Args.length] argsi;
		foreach (i, arg; args) {
			argsv[i] = var(arg);
			argsi[i] = argsv[i].slot;
		}
		var result = clone;
		.opNew(result.slot, argsi.ptr, cast(int) Args.length);
		return result;
	}

	template opDispatch(string member) {
		static assert(member != "opEquals");
		var opDispatch(string file = __FILE__, size_t line = __LINE__, Args...)(Args args) {
			ddebugInfo!(file, line);
			var[Args.length] argsv;
			int[Args.length] argsi;
			foreach (i, arg; args) {
				argsv[i] = var(arg);
				argsi[i] = argsv[i].slot;
			}
			var result = clone;
			static immutable(string) m = member;
			.opDispatch(result.slot, m.ptr, m.length, argsi.ptr, cast(int) Args.length);
			return result;
		}
	}

	string Typeof() const { // @suppress(dscanner.style.phobos_naming_convention)
		var result = clone;
		opTypeof(result.slot);
		return result.toString;
	}

	bool Instanceof(T)(T other) const { // @suppress(dscanner.style.phobos_naming_convention)
		var otherv = var(other);
		return opInstanceof(slot, otherv.slot);
	}

	T get(T, string file = __FILE__, size_t line = __LINE__)() inout if (is(Unqual!T == K[], K)) {
		static if (is(Unqual!T == K[], K)) {
			alias V = K;
		}
		else {
			static assert(0);
		}

		ddebugInfo!(file, line);

		static if (is(Unqual!V == void) || is(Unqual!V == ubyte)) {
			size_t len = getBufferLength(slot);
			if (len == 0)
				return [];

			void[] data = new void[len];
			getBuffer(slot, data.ptr);
			return cast(T) data;
		}
		else {
			size_t len = getArrayLength(slot);
			if (len == 0)
				return [];

			V[] data;
			foreach (i; 0 .. len) {
				var elem = clone;
				getArrayIndex(elem.slot, i);
				data.assumeSafeAppend ~= elem.get!V;
			}
			return cast(T) data;
		}
	}

	T get(T, string file = __FILE__, size_t line = __LINE__)() inout if (is(Unqual!T == bool)) {
		ddebugInfo!(file, line);
		return cast(T) getBool(slot);
	}

	T get(T, string file = __FILE__, size_t line = __LINE__)() inout if (isNumeric!T) {
		ddebugInfo!(file, line);
		return cast(T) getDouble(slot);
	}

	T get(T)() inout if (is(Unqual!T == var)) {
		var result;
		result.slot = nextSlot;
		copy(result.slot, slot);
		return cast(T) result;
	}

	bool toBool() {
		return castBool(slot);
	}

	string toString(string file = __FILE__, size_t line = __LINE__)() const {
		var result = clone;
		toEncodedString(result.slot);
		return cast(string) result.get!(void[], file, line);
	}

}

private var _js;

var js() {
	return _js;
}

static this() {
	_js.slot = var.nextSlot;
	setGlobal(_js.slot);
}
