# esbuild
## Start a web server
To preview your project, use the following command:
```shell
deno run --allow-net --allow-read https://esm.sh/gh/rahatool/esbuild application.js --outfile=application.min.js --servedir=./ --minify
```

## Build a JS file
```shell
deno run --allow-read --allow-write --allow-net https://esm.sh/gh/rahatool/esbuild application.js --outfile=application.min.js --minify --bundle
```

## License
This work is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).