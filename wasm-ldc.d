module wasmldc;
import std.stdio;
import std.path;
import std.file;
import std.process;
import std.conv;
import std.algorithm;
import core.stdc.stdlib;

bool verbose = false;

void run(string name, string[] args) {
	if (verbose) {
		stderr.writeln(args.joiner(" ").to!string);
	}
	int ldcStatus = spawnProcess(args).wait;
	if (ldcStatus != 0) {
		stderr.writeln(name ~ " exited with status code ", ldcStatus);
		exit(ldcStatus);
	}
}

void main(string[] args) {
	string rootDir = thisExePath.dirName.dirName;
	bool exitSoon = false;
	if (args.canFind("--build-wasm-compiler")) {
		run("ldc2", ["ldc2", "wasm-ldc.d"]);
		exitSoon = true;
	}
	if (exitSoon && args.canFind("--add-to-path")) {
		version (linux) {
			File file = File(expandTilde("~/.profile"), "a");
			file.write("\nexport PATH=\"" ~ getcwd ~ ":$PATH\"\n");
			file.close();
		}
		else {
			stderr.writeln("Cannot automatically set path on non-Linux platforms");
		}
		exitSoon = true;
	}
	if (exitSoon)
		return;
	bool excludeGlueJs = false;
	string outputName = "";
	bool noOutputName = true;
	string glueOutput = "";
	string ldc2 = rootDir.chainPath("build-ldc/bin/ldc2").to!string;
	bool release = false;
	string[] linkOpts = [
		rootDir.chainPath("wasi-libc/sysroot/lib/wasm32-wasi/libc.a").to!string,
		"-allow-undefined",
	];
	string[] compilerOpts = [
		"-fvisibility=hidden",
		"-mtriple=wasm32-unknown-unknown-wasm",
		"-I=" ~ thisExePath.dirName.to!string,
		"-c",
	];
	foreach (arg; args[1 .. $]) {
		if (arg.length >= 2 && arg[0 .. 2] == "-L") {
			linkOpts ~= arg[2 .. $];
		}
		else if (arg == "--release") {
			release = true;
		}
		else if (arg.length >= 5 && arg[0 .. 5] == "--of=") {
			noOutputName = false;
			outputName = arg[5 .. $];
			if (outputName.length >= 5 && outputName[$ - 5 .. $] == ".wasm") {
				outputName = outputName[0 .. $ - 5];
			}
		}
		else if (arg == "--no-glue") {
			excludeGlueJs = true;
		}
		else if (arg.length > 14 && arg[0 .. 14] == "--glue-output=") {
			glueOutput = arg[14 .. $];
		}
		else {
			if (arg == "-v") {
				verbose = true;
			}
			if (arg.length > 2 && arg[0] != '-' && arg[$ - 2 .. $] == ".d") {
				if (noOutputName) {
					noOutputName = false;
					outputName = arg[0 .. $ - 2];
				}
			}
			compilerOpts ~= arg;
		}
	}
	if (outputName == "") {
		outputName = "app";
	}
	compilerOpts ~= [
		"--of=" ~ outputName ~ ".o",
		thisExePath.dirName.chainPath("glue.d").to!string,
	];
	linkOpts ~= [
		outputName ~ ".o",
		"-o",
		outputName ~ ".wasm",
	];
	if (release) {
		linkOpts ~= [
			rootDir.chainPath("build-druntime/out/lib/libdruntime-ldc.a").to!string,
			rootDir.chainPath("build-druntime/out/lib/libphobos2-ldc.a").to!string,
			"--lto-O3",
		];
		compilerOpts ~= [
			"--boundscheck=off",
			"--Os",
		];
	}
	else {
		linkOpts ~= [
			rootDir.chainPath("build-druntime/out/lib/libdruntime-ldc-debug.a").to!string,
			rootDir.chainPath("build-druntime/out/lib/libphobos2-ldc-debug.a").to!string,
		];
		compilerOpts ~= [
			"--boundscheck=on",
			"-d-debug",
			"-g",
			"--O0",
		];
	}
	run("ldc2", [ldc2] ~ compilerOpts);
	run("wasm-ld", ["wasm-ld"] ~ linkOpts);
	if (release) {
		run("wasm-opt", ["wasm-opt", outputName ~ ".wasm",
			"--vacuum", "--dce", "-o", outputName ~ ".wasm"]);
	}
	if (!excludeGlueJs) {
		if (glueOutput == "") {
			glueOutput = outputName.dirName.chainPath("glue.min.js").to!string;
		}
		copy(thisExePath.dirName.chainPath("glue.min.js").to!string, glueOutput);
	}
}
