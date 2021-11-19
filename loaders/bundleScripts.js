const fsPromises = require("fs").promises;
const getConfig = require("../services/getConfig.js");
const { exec } = require("child_process");
const fs = require("fs");

//init config
const config = getConfig();

//Bundles index.js files in the specified rootDistPath and any child directories,
//then places the output in static/bundles/ with the same path relative to rootDistPath, truncating any "scripts" directories and moving their contents up a directory.
//index.js files must be in a "scripts" folder, or else the function will skip it
var rootDistPath = config.distributionPath;
async function bundleScripts(path) {
	//read dir from path
	fsPromises.readdir(path, { withFileTypes: true }).then((dirent) => {
		for (var element of dirent) {
			//if element is a directory, call this function on that directory
			if (element.isDirectory()) {
				var elementPath = path + "/" + element.name;
				bundleScripts(elementPath);

				//else if element is index.js, work out paths and bundle file with browserify
			} else if (element.isFile() && element.name == "index.js") {
				var relativePath = path.replace(rootDistPath, "");
				var bundlePath = "static/bundles" + relativePath.slice(0, -7); // truncate "scripts" folder
				var outputScriptPath = bundlePath + element.name;
				var inputScriptPath = rootDistPath.slice(2) + relativePath + "/" + element.name;

				//if parent folder is not "scripts", skip this file
				if (relativePath.slice(-7) != "scripts") {
					return;
				}
				fs.mkdirSync("./" + bundlePath, { recursive: true }); //makes bundlePath directory if it does not exist
				exec(`npx browserify ${inputScriptPath} --s bundle > ${outputScriptPath}`); //bundle script, then output to ./static/bundles
			}
		}
	});
}

//if rootDistPath exists, run bundleScripts
fs.promises.readdir("./", { withFileTypes: true }).then((dirent) => {
	var folderExists = false;
	for (var element of dirent) {
		if (element.name == rootDistPath.slice(2)) {
			folderExists = true;
		}
	}
	if (folderExists) {
		bundleScripts(rootDistPath);
	}
});
