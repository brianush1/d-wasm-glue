// A small WASI implementation, written with the express purpose to allow D code to run on the web

class ExitError extends Error {

	constructor(code) {
		super(`Exited with code ${code}`);
		this.code = code;
	}

}

(function() {

	const WASI_ADVICE_NORMAL = 0;
	const WASI_ADVICE_SEQUENTIAL = 1;
	const WASI_ADVICE_RANDOM = 2;
	const WASI_ADVICE_WILLNEED = 3;
	const WASI_ADVICE_DONTNEED = 4;
	const WASI_ADVICE_NOREUSE = 5;
	const WASI_CLOCK_REALTIME = 0;
	const WASI_CLOCK_MONOTONIC = 1;
	const WASI_CLOCK_PROCESS_CPUTIME_ID = 2;
	const WASI_CLOCK_THREAD_CPUTIME_ID = 3;
	const WASI_DIRCOOKIE_START = BigInt(0);
	const WASI_ESUCCESS = 0;
	const WASI_E2BIG = 1;
	const WASI_EACCES = 2;
	const WASI_EADDRINUSE = 3;
	const WASI_EADDRNOTAVAIL = 4;
	const WASI_EAFNOSUPPORT = 5;
	const WASI_EAGAIN = 6;
	const WASI_EALREADY = 7;
	const WASI_EBADF = 8;
	const WASI_EBADMSG = 9;
	const WASI_EBUSY = 10;
	const WASI_ECANCELED = 11;
	const WASI_ECHILD = 12;
	const WASI_ECONNABORTED = 13;
	const WASI_ECONNREFUSED = 14;
	const WASI_ECONNRESET = 15;
	const WASI_EDEADLK = 16;
	const WASI_EDESTADDRREQ = 17;
	const WASI_EDOM = 18;
	const WASI_EDQUOT = 19;
	const WASI_EEXIST = 20;
	const WASI_EFAULT = 21;
	const WASI_EFBIG = 22;
	const WASI_EHOSTUNREACH = 23;
	const WASI_EIDRM = 24;
	const WASI_EILSEQ = 25;
	const WASI_EINPROGRESS = 26;
	const WASI_EINTR = 27;
	const WASI_EINVAL = 28;
	const WASI_EIO = 29;
	const WASI_EISCONN = 30;
	const WASI_EISDIR = 31;
	const WASI_ELOOP = 32;
	const WASI_EMFILE = 33;
	const WASI_EMLINK = 34;
	const WASI_EMSGSIZE = 35;
	const WASI_EMULTIHOP = 36;
	const WASI_ENAMETOOLONG = 37;
	const WASI_ENETDOWN = 38;
	const WASI_ENETRESET = 39;
	const WASI_ENETUNREACH = 40;
	const WASI_ENFILE = 41;
	const WASI_ENOBUFS = 42;
	const WASI_ENODEV = 43;
	const WASI_ENOENT = 44;
	const WASI_ENOEXEC = 45;
	const WASI_ENOLCK = 46;
	const WASI_ENOLINK = 47;
	const WASI_ENOMEM = 48;
	const WASI_ENOMSG = 49;
	const WASI_ENOPROTOOPT = 50;
	const WASI_ENOSPC = 51;
	const WASI_ENOSYS = 52;
	const WASI_ENOTCONN = 53;
	const WASI_ENOTDIR = 54;
	const WASI_ENOTEMPTY = 55;
	const WASI_ENOTRECOVERABLE = 56;
	const WASI_ENOTSOCK = 57;
	const WASI_ENOTSUP = 58;
	const WASI_ENOTTY = 59;
	const WASI_ENXIO = 60;
	const WASI_EOVERFLOW = 61;
	const WASI_EOWNERDEAD = 62;
	const WASI_EPERM = 63;
	const WASI_EPIPE = 64;
	const WASI_EPROTO = 65;
	const WASI_EPROTONOSUPPORT = 66;
	const WASI_EPROTOTYPE = 67;
	const WASI_ERANGE = 68;
	const WASI_EROFS = 69;
	const WASI_ESPIPE = 70;
	const WASI_ESRCH = 71;
	const WASI_ESTALE = 72;
	const WASI_ETIMEDOUT = 73;
	const WASI_ETXTBSY = 74;
	const WASI_EXDEV = 75;
	const WASI_ENOTCAPABLE = 76;
	const WASI_EVENT_FD_READWRITE_HANGUP = 0x0001;
	const WASI_EVENTTYPE_CLOCK = 0;
	const WASI_EVENTTYPE_FD_READ = 1;
	const WASI_EVENTTYPE_FD_WRITE = 2;
	const WASI_FDFLAG_APPEND = 0x0001;
	const WASI_FDFLAG_DSYNC = 0x0002;
	const WASI_FDFLAG_NONBLOCK = 0x0004;
	const WASI_FDFLAG_RSYNC = 0x0008;
	const WASI_FDFLAG_SYNC = 0x0010;
	const WASI_FILETYPE_UNKNOWN = 0;
	const WASI_FILETYPE_BLOCK_DEVICE = 1;
	const WASI_FILETYPE_CHARACTER_DEVICE = 2;
	const WASI_FILETYPE_DIRECTORY = 3;
	const WASI_FILETYPE_REGULAR_FILE = 4;
	const WASI_FILETYPE_SOCKET_DGRAM = 5;
	const WASI_FILETYPE_SOCKET_STREAM = 6;
	const WASI_FILETYPE_SYMBOLIC_LINK = 7;
	const WASI_FILESTAT_SET_ATIM = 0x0001;
	const WASI_FILESTAT_SET_ATIM_NOW = 0x0002;
	const WASI_FILESTAT_SET_MTIM = 0x0004;
	const WASI_FILESTAT_SET_MTIM_NOW = 0x0008;
	const WASI_LOOKUP_SYMLINK_FOLLOW = 0x00000001;
	const WASI_O_CREAT = 0x0001;
	const WASI_O_DIRECTORY = 0x0002;
	const WASI_O_EXCL = 0x0004;
	const WASI_O_TRUNC = 0x0008;
	const WASI_SOCK_RECV_PEEK = 0x0001;
	const WASI_SOCK_RECV_WAITALL = 0x0002;
	const WASI_RIGHT_FD_DATASYNC = BigInt(0x0000000000000001);
	const WASI_RIGHT_FD_READ = BigInt(0x0000000000000002);
	const WASI_RIGHT_FD_SEEK = BigInt(0x0000000000000004);
	const WASI_RIGHT_FD_FDSTAT_SET_FLAGS = BigInt(0x0000000000000008);
	const WASI_RIGHT_FD_SYNC = BigInt(0x0000000000000010);
	const WASI_RIGHT_FD_TELL = BigInt(0x0000000000000020);
	const WASI_RIGHT_FD_WRITE = BigInt(0x0000000000000040);
	const WASI_RIGHT_FD_ADVISE = BigInt(0x0000000000000080);
	const WASI_RIGHT_FD_ALLOCATE = BigInt(0x0000000000000100);
	const WASI_RIGHT_PATH_CREATE_DIRECTORY = BigInt(0x0000000000000200);
	const WASI_RIGHT_PATH_CREATE_FILE = BigInt(0x0000000000000400);
	const WASI_RIGHT_PATH_LINK_SOURCE = BigInt(0x0000000000000800);
	const WASI_RIGHT_PATH_LINK_TARGET = BigInt(0x0000000000001000);
	const WASI_RIGHT_PATH_OPEN = BigInt(0x0000000000002000);
	const WASI_RIGHT_FD_READDIR = BigInt(0x0000000000004000);
	const WASI_RIGHT_PATH_READLINK = BigInt(0x0000000000008000);
	const WASI_RIGHT_PATH_RENAME_SOURCE = BigInt(0x0000000000010000);
	const WASI_RIGHT_PATH_RENAME_TARGET = BigInt(0x0000000000020000);
	const WASI_RIGHT_PATH_FILESTAT_GET = BigInt(0x0000000000040000);
	const WASI_RIGHT_PATH_FILESTAT_SET_SIZE = BigInt(0x0000000000080000);
	const WASI_RIGHT_PATH_FILESTAT_SET_TIMES = BigInt(0x0000000000100000);
	const WASI_RIGHT_FD_FILESTAT_GET = BigInt(0x0000000000200000);
	const WASI_RIGHT_FD_FILESTAT_SET_SIZE = BigInt(0x0000000000400000);
	const WASI_RIGHT_FD_FILESTAT_SET_TIMES = BigInt(0x0000000000800000);
	const WASI_RIGHT_PATH_SYMLINK = BigInt(0x0000000001000000);
	const WASI_RIGHT_PATH_REMOVE_DIRECTORY = BigInt(0x0000000002000000);
	const WASI_RIGHT_PATH_UNLINK_FILE = BigInt(0x0000000004000000);
	const WASI_RIGHT_POLL_FD_READWRITE = BigInt(0x0000000008000000);
	const WASI_RIGHT_SOCK_SHUTDOWN = BigInt(0x0000000010000000);
	const WASI_SOCK_RECV_DATA_TRUNCATED = 0x0001;
	const WASI_SHUT_RD = 0x01;
	const WASI_SHUT_WR = 0x02;
	const WASI_SIGHUP = 1;
	const WASI_SIGINT = 2;
	const WASI_SIGQUIT = 3;
	const WASI_SIGILL = 4;
	const WASI_SIGTRAP = 5;
	const WASI_SIGABRT = 6;
	const WASI_SIGBUS = 7;
	const WASI_SIGFPE = 8;
	const WASI_SIGKILL = 9;
	const WASI_SIGUSR1 = 10;
	const WASI_SIGSEGV = 11;
	const WASI_SIGUSR2 = 12;
	const WASI_SIGPIPE = 13;
	const WASI_SIGALRM = 14;
	const WASI_SIGTERM = 15;
	const WASI_SIGCHLD = 16;
	const WASI_SIGCONT = 17;
	const WASI_SIGSTOP = 18;
	const WASI_SIGTSTP = 19;
	const WASI_SIGTTIN = 20;
	const WASI_SIGTTOU = 21;
	const WASI_SIGURG = 22;
	const WASI_SIGXCPU = 23;
	const WASI_SIGXFSZ = 24;
	const WASI_SIGVTALRM = 25;
	const WASI_SIGPROF = 26;
	const WASI_SIGWINCH = 27;
	const WASI_SIGPOLL = 28;
	const WASI_SIGPWR = 29;
	const WASI_SIGSYS = 30;
	const WASI_SUBSCRIPTION_CLOCK_ABSTIME = 0x0001;
	const WASI_WHENCE_CUR = 0;
	const WASI_WHENCE_END = 1;
	const WASI_WHENCE_SET = 2;
	const WASI_PREOPENTYPE_DIR = 0;

	function unsupported(name) {
		return function() {
			throw new Error(`unsupported function '${name}' called with ${[...arguments].join(", ")}`);
		};
	}

	const decoder = new TextDecoder();
	function decode(buffer) {
		return decoder.decode(buffer);
	}

	const encoder = new TextEncoder();
	function encode(str) {
		return encoder.encode(str);
	}

	class OutputBuffer {
		constructor(handler) {
			this.buffer = new Uint8Array(1024 * 1024);
			this.bufferLength = 0;
			this.handler = handler;
		}

		write(data) {
			for (const byte of new Uint8Array(data)) {
				if (byte === 10) {
					this.flush();
					continue;
				}

				this.buffer[this.bufferLength] = byte;
				this.bufferLength += 1;
				if (this.bufferLength === this.buffer.byteLength) {
					this.flush();
				}
			}
		}

		flush() {
			const s = decode(this.buffer.slice(0, this.bufferLength));
			if (s.length > 0) {
				this.handler(s);
			}
			this.bufferLength = 0;
		}
	}

	const stdout = new OutputBuffer(msg => console.log(msg));
	const stderr = new OutputBuffer(msg => console.error(msg));

	function isBufferLike(data) {
		return false
			|| data instanceof Int8Array
			|| data instanceof Uint8Array
			|| data instanceof Uint8ClampedArray
			|| data instanceof Int16Array
			|| data instanceof Uint16Array
			|| data instanceof Int32Array
			|| data instanceof Uint32Array
			|| data instanceof Float32Array
			|| data instanceof Float64Array
			|| data instanceof BigInt64Array
			|| data instanceof BigUint64Array
			|| data instanceof ArrayBuffer;
	}

	function isReallyFunction(func, args) {
		if (typeof func === "function") {
			let isPrototyped = false;
			let at = func.prototype;
			while (at) {
				if (Object.getOwnPropertyNames(at).length > 0) {
					isPrototyped = true;
					break;
				}
				at = Object.getPrototypeOf(at);
			}
			return !isPrototyped || args.length > 0;
		}
		else {
			return false;
		}
	}

	/**
	 * Loads a WASM file and calls the `_start` function
	 * @param {string} filename The path to the .wasm file to load
	 */
	(window || self).runFile = async function runFile(filename) {
		/** @type {WebAssembly.Memory} */
		let memory;

		const MEMORY = {
			read(ptr, len) {
				return new Uint8Array(memory.buffer, ptr, len);
			},
			write(ptr, buffer) {
				new Uint8Array(memory.buffer, ptr, buffer.byteLength).set(buffer);
			},
			getUint8(ptr) {
				return new Uint8Array(memory.buffer, ptr, 1)[0];
			},
			setUint8(ptr, value) {
				new Uint8Array(memory.buffer, ptr, 1)[0] = value;
			},
			getInt8(ptr) {
				return new Int8Array(memory.buffer, ptr, 1)[0];
			},
			setInt8(ptr, value) {
				new Int8Array(memory.buffer, ptr, 1)[0] = value;
			},
			getUint16(ptr) {
				return new Uint16Array(memory.buffer, ptr, 1)[0];
			},
			setUint16(ptr, value) {
				new Uint16Array(memory.buffer, ptr, 1)[0] = value;
			},
			getInt16(ptr) {
				return new Int16Array(memory.buffer, ptr, 1)[0];
			},
			setInt16(ptr, value) {
				new Int16Array(memory.buffer, ptr, 1)[0] = value;
			},
			getUint32(ptr) {
				return new Uint32Array(memory.buffer, ptr, 1)[0];
			},
			setUint32(ptr, value) {
				new Uint32Array(memory.buffer, ptr, 1)[0] = value;
			},
			getInt32(ptr) {
				return new Int32Array(memory.buffer, ptr, 1)[0];
			},
			setInt32(ptr, value) {
				new Int32Array(memory.buffer, ptr, 1)[0] = value;
			},
			getSize(ptr) {
				return this.getUint32(ptr);
			},
			setSize(ptr, value) {
				this.setUint32(ptr, value);
			},
			getUint64(ptr) {
				return new BigUint64Array(memory.buffer, ptr, 1)[0];
			},
			setUint64(ptr, value) {
				new BigUint64Array(memory.buffer, ptr, 1)[0] = value;
			},
			getInt64(ptr) {
				return new BigInt64Array(memory.buffer, ptr, 1)[0];
			},
			setInt64(ptr, value) {
				new BigInt64Array(memory.buffer, ptr, 1)[0] = value;
			},
			iovs(ptr, len) {
				const result = [];
				for (let i = 0; i < len; ++i) {
					result[i] = this.read(
						this.getSize(ptr + i * 8),
						this.getSize(ptr + i * 8 + 4),
					);
				}
				return result;
			},
		};

		const vars = new Map();
		vars.set(0, null);

		let debugFile = "unknown", debugLine = 0;

		function processError(e) {
			throw new Error(`${debugFile}:${debugLine}: ${e.message}`);
		}

		const glue = {
			setBool: function(slot, value) {
				vars.set(slot, value !== 0);
			},
			setDouble: function(slot, value) {
				vars.set(slot, value);
			},
			getBool: function(slot) {
				const data = vars.get(slot);
				if (typeof data === "boolean") {
					return data ? 1 : 0;
				}
				else {
					processError(new Error("var is not a bool"));
				}
			},
			getDouble: function(slot) {
				const data = vars.get(slot);
				if (typeof data === "number") {
					return data;
				}
				else {
					processError(new Error("var is not a double"));
				}
			},
			setString: function(slot, ptr, len) {
				vars.set(slot, decode(MEMORY.read(ptr, len)));
			},
			setBuffer: function(slot, ptr, len) {
				vars.set(slot, MEMORY.read(ptr, len));
			},
			setGlobal: function(slot) {
				vars.set(slot, window || self);
			},
			getBufferLength: function(slot) {
				const data = vars.get(slot);
				if (isBufferLike(data)) {
					return data.byteLength;
				}
				else {
					processError(new Error("var is not a buffer"));
				}
			},
			getBuffer: function(slot, ptr) {
				MEMORY.write(ptr, vars.get(slot));
			},
			getArrayLength: function(slot) {
				const data = vars.get(slot);
				if (data instanceof Array) {
					return data.length;
				}
				else {
					processError(new Error("var is not an array"));
				}
			},
			getArrayIndex: function(slot, index) {
				vars.set(slot, vars.get(slot)[index]);
			},
			toEncodedString: function(slot) {
				vars.set(slot, encode(String(vars.get(slot))));
			},
			copy: function(slot, fromSlot) {
				vars.set(slot, vars.get(fromSlot));
			},
			undefine: function(slot) {
				if (slot > 0) {
					vars.delete(slot);
				}
			},
			makeArray: function(slot) {
				vars.set(slot, []);
			},
			push: function(slot, valueSlot) {
				vars.get(slot).push(vars.get(valueSlot));
			},
			getIndex: function(slot, keySlot) {
				vars.set(slot, vars.get(slot)[vars.get(keySlot)]);
			},
			setIndex: function(slot, valueSlot, keySlot) {
				try {
					vars.get(slot)[vars.get(keySlot)] = vars.get(valueSlot);
				}
				catch (e) {
					processError(e);
				}
			},
			opTypeof: function(slot) {
				vars.set(slot, typeof vars.get(slot));
			},
			opInstanceof: function(slot, otherSlot) {
				return vars.get(slot) instanceof vars.get(otherSlot) ? 1 : 0;
			},
			opCall: function(slot, ptr, numArgs) {
				try {
					const args = [];
					for (let i = 0; i < numArgs; ++i) {
						args.push(vars.get(MEMORY.getInt32(ptr + i * 4)));
					}
					const value = vars.get(slot);
					vars.set(slot, value(...args));
				}
				catch (e) {
					processError(e);
				}
			},
			opNew: function(slot, ptr, numArgs) {
				try {
					const args = [];
					for (let i = 0; i < numArgs; ++i) {
						args.push(vars.get(MEMORY.getInt32(ptr + i * 4)));
					}
					const value = vars.get(slot);
					vars.set(slot, new value(...args));
				}
				catch (e) {
					processError(e);
				}
			},
			opDispatch: function(slot, mptr, mlen, ptr, numArgs) {
				try {
					const args = [];
					for (let i = 0; i < numArgs; ++i) {
						args.push(vars.get(MEMORY.getInt32(ptr + i * 4)));
					}
					const member = decode(MEMORY.read(mptr, mlen));
					const base = vars.get(slot);
					const value = base[member];
					if (isReallyFunction(value, args) || args.length > 1) {
						vars.set(slot, value(...args));
					}
					else if (args.length === 0) {
						vars.set(slot, value);
					}
					else if (args.length === 1) {
						const vvalue = args[0];
						base[member] = vvalue;
						vars.set(slot, vvalue);
					}
				}
				catch (e) {
					processError(e);
				}
			},
			debugInfo: function(ptr, len, line) {
				debugFile = decode(MEMORY.read(ptr, len));
				debugLine = line;
			},
			checkEquals: function(slot, otherSlot) {
				return (vars.get(slot) === vars.get(otherSlot)) ? 1 : 0;
			},
		};

		const startTime = performance.now();

		const WASI = {
			proc_exit: function(/* uint */ code) {
				throw new ExitError(code);
			},
			clock_res_get: function(/* uint */ clock_id, /* ulong* */ resolution) {
				switch (clock_id) {
				case WASI_CLOCK_REALTIME:
				case WASI_CLOCK_MONOTONIC:
				case WASI_CLOCK_PROCESS_CPUTIME_ID:
				case WASI_CLOCK_THREAD_CPUTIME_ID:
					MEMORY.setUint64(resolution, BigInt(1));
					return WASI_ESUCCESS;
				default:
					return WASI_EINVAL;
				}
			},
			clock_time_get: function(/* uint */ clock_id, /* ulong */ precision, /* ulong* */ time) {
				switch (clock_id) {
				case WASI_CLOCK_REALTIME:
					MEMORY.setUint64(time, BigInt(Date.now() * 1000000));
					return WASI_ESUCCESS;
				case WASI_CLOCK_MONOTONIC:
				case WASI_CLOCK_PROCESS_CPUTIME_ID:
				case WASI_CLOCK_THREAD_CPUTIME_ID:
					MEMORY.setUint64(time, BigInt((performance.now() - startTime) * 1000000));
					return WASI_ESUCCESS;
				default:
					return WASI_EINVAL;
				}
			},
			fd_fdstat_get: function(/* uint */ fd, /* fdstat_t* */ buf) {
				if (fd !== 1 && fd !== 2)
					return WASI_EBADF;
				MEMORY.setUint8(buf, WASI_FILETYPE_CHARACTER_DEVICE);
				MEMORY.setUint16(buf + 2, WASI_FDFLAG_APPEND);
				MEMORY.setUint64(buf + 8, WASI_RIGHT_FD_WRITE);
				MEMORY.setUint64(buf + 16, WASI_RIGHT_FD_WRITE);
				return WASI_ESUCCESS;
			},
			fd_fdstat_set_flags: unsupported("fd_fdstat_set_flags"),
			fd_close: unsupported("fd_close"),
			fd_filestat_set_size: unsupported("fd_filestat_set_size"),
			path_open: unsupported("path_open"),
			fd_prestat_get: function(/* uint */ fd, /* prestat_t* */ buf) {
				return WASI_EBADF;
			},
			fd_prestat_dir_name: unsupported("fd_prestat_dir_name"),
			fd_read: unsupported("fd_read"),
			fd_seek: unsupported("fd_seek"),
			fd_write: function(/* uint */ fd, /* ciovec_t* */ iovs, /* size_t */ iovs_len, /* size_t* */ nwritten) {
				const buffers = MEMORY.iovs(iovs, iovs_len);

				let totalLength = 0;

				for (const buffer of buffers) {
					totalLength += buffer.byteLength;
				}

				const output = fd === 1 ? stdout : stderr;

				for (const buffer of buffers) {
					output.write(buffer);
				}

				MEMORY.setSize(nwritten, totalLength);

				return WASI_ESUCCESS;
			},
		};

		const LIB = {
			wasi_unstable: WASI,
			wasi_snapshot_preview1: WASI,
			env: {
				// TODO: support 128-bit integers
				__multi3: unsupported("__multi3"),

				_d_eh_enter_catch: unsupported("_d_eh_enter_catch"),
			},
			glue,
		};

		const bytes = await fetch(filename).then(x => x.arrayBuffer());
		const source = await WebAssembly.instantiate(bytes, LIB);

		memory = source.instance.exports.memory;

		try {
			source.instance.exports["_start"]();
		}
		catch (e) {
			stdout.flush();
			stderr.flush();

			if (e instanceof ExitError && e.code === 0) {
				return;
			}
			else {
				throw e;
			}
		}
	}

})();