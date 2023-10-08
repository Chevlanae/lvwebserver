import { glob } from "glob";
import * as path from "path";
import webpack from "webpack";

const viewDir = "views";

let matches = glob.sync(viewDir + "/**/*/index.js");
let entries: webpack.EntryObject = {};

for (let item of matches) {
	let name = item.slice(viewDir.length, -9);

	entries[name] = path.resolve(__dirname, item);
}

const config: webpack.Configuration = {
	entry: entries,
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "public/scripts/"),
	},
	mode: "production",
};

export default config;
