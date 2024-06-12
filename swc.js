/*
- (-) its minifier does not make local names shorter.
- (-) external/remote resources are not supported. use dynamic imports to load them.
- (-) implicitly-imported JSX is not supported.
*/

let readLocalFile = (path) => {
	return require('fs').openFile(path).readAll();
};
let readRemoteFile = (path) => {
	return fetch(`https://esm.sh/gh/denoland/deno_emit@deno_registry/${path}?raw`).body.readAll();
};

let url = new URL('./deno_emit/emit.generated.js');
let source = readLocalFile(url).toString();
let transform = (source) => {
	source = source.replaceAll('import.meta.url', `"${url.href}"`);
	source = source.replace(/#(?=[a-zA-Z])/g, '_');
	source += `WasmBuildLoader.prototype._instantiate = async function(url, decompress) {
		const {imports, cache} = this._options;
		return WebAssembly.instantiate(readFile(url), imports);
		// return WebAssembly.instantiateStreaming(wasmResponse, imports);
	};`;

	let exports = [];
	source = source.replace(/export\s+(?=(?:async\s+)?function(?:\s+\*)?\s+([^(\s]+)|(?:let|const)\s+([^=\s]+))/g, (all, functionName, variableName) => {
		exports.push(functionName ?? variableName);
		return ``;
	});
	source += `return {${exports}};`;
	return source;
};
let start = async() => {
	let emit = Function('readFile', transform(source))(readLocalFile);
	let {instantiate, isInstantiated, bundle, transpile} = emit;
	await instantiate({url: './deno_emit/emit_bg.wasm'});

	let loader = (specifier, {isDynamic, cacheSetting, checksum}) => {
		// cacheSetting: https://docs.rs/deno_emit/latest/deno_emit/enum.CacheSetting.html#variants
		console.log(specifier);

		if (0 && specifier.endsWith('runtime')) {
			return {
				kind: 'external',
				specifier: specifier,
			};
		}
		if (specifier.endsWith('a module without extension')) {
			return {
				kind: 'redirect',
				specifier: specifier + '.js',
			};
		}
		return {
			kind: 'module',
			specifier: specifier + (specifier.includes('.') ? '' : '.tsx'),
			content: [
				...Array.from(new TextEncoder().encode(`import '${compilerOptions.jsxImportSource}/jsx-runtime';`)),
				...Array.from(readLocalFile(specifier.replace('file:///', '') + (specifier.includes('.') ? '' : '.ts')))
			],
		};
	};
	let processImportMap = (imports) => {
		if (imports) {
			return {
				baseUrl: 'file:///' + process.cwd() + '/',
				jsonString: JSON.stringify({
					imports,
					scopes: {}
				}),
			}
		}
		return undefined;
	};
	let compilerOptions = {
		checkJs: true,
		experimentalDecorators: false,
		emitDecoratorMetadata: false,
		// importsNotUsedAsValues: string, // one of "remove", "preserve", "error"
		
		// inlineSourceMap: true,
		// inlineSources: true,
		sourceMap: true,
	
		jsx: "react-jsx", // one of "preserve", "react-jsx", "react-jsxdev", "precompile", "react"
		jsxImportSource: "fre", // implicitly import "BASE/jsx-runtime"
		// jsxFactory: "React.createElement",
		// jsxFragmentFactory: "Fragment",
	};
	let importMap = processImportMap({
		'fre/jsx-runtime': './jsx-runtime.ts',
	});
	let root = 'file:///C:/Users/Mahdi/Desktop/main.tsx';
	console.log(
		await transpile(
			root,
			loader,
			importMap, // maybe_import_map
			compilerOptions, // maybe_compiler_options
		)
	);
	console.log(
		await bundle(
			root,
			loader,
			'classic', // maybe_bundle_type; one of "module", "classic"
			importMap, // maybe_import_map
			compilerOptions, // maybe_compiler_options
			true, // minify
		)
	);
};
start();