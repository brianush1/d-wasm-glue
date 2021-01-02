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
	double getDouble(int slot);
	void setString(int slot, const(void)* ptr, size_t len);
	void setBuffer(int slot, const(void)* ptr, size_t len);
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

alias var = RefCounted!VarImpl;

private void ddebugInfo(string file, size_t line)() {
	debug {
		debugInfo(file.ptr, file.length, line);
	}
}

private struct VarImpl {
private:

	int slot = -1;

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

	~this() {
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

	T get(T, string file = __FILE__, size_t line = __LINE__)() const if (is(Unqual!T == K[], K)) {
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

	T get(T, string file = __FILE__, size_t line = __LINE__)() const if (is(Unqual!T == bool)) {
		ddebugInfo!(file, line);
		return cast(T) getBool(slot);
	}

	T get(T, string file = __FILE__, size_t line = __LINE__)() const if (isNumeric!T) {
		ddebugInfo!(file, line);
		return cast(T) getDouble(slot);
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
	_js.slot = VarImpl.nextSlot;
	setGlobal(_js.slot);
}
