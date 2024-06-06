# esbuild
## Start a web server
To preview your project, use the following command:
```shell
deno run --allow-net --allow-read jsr:@raha/esbuild application.js --outfile=application.min.js --servedir=./ --minify
deno run --allow-net --allow-read npm:@raha.group/esbuild application.js --outfile=application.min.js --servedir=./ --minify
deno run --allow-net --allow-read https://esm.sh/@raha.group/esbuild application.js --outfile=application.min.js --servedir=./ --minify
```

## Build a JS file
```shell
deno run --allow-read --allow-write --allow-net jsr:@raha/esbuild application.js --outfile=application.min.js --minify --bundle
deno run --allow-read --allow-write --allow-net npm:@raha.group/esbuild application.js --outfile=application.min.js --minify --bundle
deno run --allow-read --allow-write --allow-net https://esm.sh/@raha.group/esbuild application.js --outfile=application.min.js --minify --bundle
```