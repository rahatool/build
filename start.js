let { parseArgs } = await import(`https://deno.land/std/cli/parse_args.ts`);
let inputFile = Deno.args[0];
let options = parseArgs(Deno.args, {
	boolean: [`minify`, `bundle`],
	string: [`outfile`, `servedir`, `charset`, `format`],
	default: { charset: `utf8`, format: `esm` },
});

let esbuild;
let httpExtension = {
	name: `http file system`,
	setup: (build) => {
		build.onResolve(
			{ filter: /^(https?:)?\/\/|\.js$/g },
			(args) => {
				return {
					path: args.path,
					namespace: `http-url`,
				};
			},
		);
		build.onResolve(
			{ filter: /.*/g, namespace: `http-url` },
			(args) => {
				return {
					path: new URL(args.path, args.importer).toString(),
					namespace: `http-url`,
				};
			},
		);
		build.onLoad(
			{ filter: /.*/g, namespace: `http-url` },
			async (args) => {
				return {
					contents: await (await fetch(args.path)).text(),
					loader: `js`,
				};
			},
		);
	},
};
let build = async () => {
	if (!esbuild) {
		esbuild = await import(`https://esm.sh/esbuild-wasm/esm/browser.js`);
		globalThis.location = { href: Deno.cwd() };
		await esbuild.initialize({
			wasmURL: `https://esm.sh/esbuild-wasm/esbuild.wasm`,
			worker: false,
		});
	}
	let output = await esbuild.build({
		stdin: { contents: await Deno.readTextFile(inputFile) },
		plugins: [httpExtension],
		bundle: options.bundle,
		minify: options.minify,
		format: options.format,
		charset: options.charset,
		pure: [],
	});
	return output.outputFiles[0];
};

if (options.servedir) {
	options.outfile ??= inputFile;
	let mediaTypes = {
		html: `text/html`,
		css: `text/css`,
		js: `application/javascript`,
		svg: `image/svg+xml`,
	};
	let handleHttp = async (request) => {
		let url = new URL(request.url);
		let filePath = decodeURIComponent(url.pathname);
		try {
			let file = filePath.slice(1) == options.outfile ? { readable: (await build()).text } : await Deno.open(options.servedir + filePath, { read: true });
			return new Response(file.readable, { headers: { [`content-type`]: mediaTypes[filePath.split(`.`).pop()] ?? `application/octet-stream` } });
		} catch {
			return new Response(`404 Not Found`, { status: 404 });
		}
	};
	Deno.serve({ port: 8000, hostname: `0.0.0.0` }, handleHttp);
} else {
	await Deno.writeFile(options.outfile, (await build()).contents);
}

// esbuild.cmd ./application.js --minify --charset=utf8 --outfile=application.min.js --format=esm
// esbuild.cmd application.js --outfile=application.min.js --servedir=./ --bundle --minify --charset=utf8 --format=esm