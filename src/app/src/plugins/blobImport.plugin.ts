
import fs from 'fs'
import path from 'path'

import type { Plugin } from 'vite'

export const blobLoader = (extension: string): Plugin => {

	const pluginName = 'vite-plugin-blob-loader'

	return ({
		name: pluginName,
		enforce: 'post',

		async transform(_, id) {
			const [filePath, query] = id.split('?')
			if (query !== 'blob')
				return null
			if (!filePath.endsWith(extension))
				return null

			const buffer = await fs.promises.readFile(filePath)
			const byteArray = new Uint8Array(buffer.byteLength)
			buffer.copy(byteArray)

			const fileName = import.meta.env.DEV
				? path.basename(filePath)
				: this.emitFile({
					source: '',
					type: 'asset'
				}) + path.extname(filePath)
			this.emitFile({
				fileName,
				source: byteArray,
				type: 'asset'
			})
			const helperFile = await fs.promises.readFile('./src/plugins/blobImport.js', { encoding: 'utf8' })
			return {
				code: `
                    ${helperFile}
                    const { default: url } = await import("${filePath}?url");
                    function getBlobData() {
                        return createBlobAccessor(url);
                    }
                    export default getBlobData;
                `}
		}
	})
}