import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

export default defineConfig({
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'esm'
	},
  plugins: [
    typescript(),
		getBabelOutputPlugin({
			presets: ['@babel/preset-env'],
		})
  ]
})
