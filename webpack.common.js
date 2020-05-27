const path = require('path');

module.exports = {
	entry: './src/main.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve( __dirname, 'dist' ),
	},
	module: {
		rules: [
			{
				test: /\.(glsl|vs|fs|vert|frag)$/,
				exclude: /node_modules/,
				use: [
				  'raw-loader',
				  'glslify-loader'
				]
			},
			{
				test: /\.(png|jpe?g|gif|dds|hdr)$/i,
				loader: 'file-loader',
				options: {
					//publicPath: 'assets',
				},
			}
		]
	}
};
