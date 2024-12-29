import fs from 'node:fs'
import path from 'node:path'
import markdownIt from 'markdown-it'

const paths = {
    script: path.dirname(new URL(import.meta.url).pathname),
    configFile: '../config.json',
    styles: '../style',
    publicStyles: '../public/style',
    images: '../asset/image',
    publicImages: '../public/asset/image',
    favicons: '../asset/favicon',
    publicFavicons: '../public/asset/favicon',
    templates: '../template',
    markdown: '../markdown',
    staticHtml: '../static-html',
    public: '../public',
}

function copyFiles(src, dest) {
    try {
        fs.cpSync(src, dest, { recursive: true })
    } catch (err) {
        console.error(`Erro ao copiar de ${src} para ${dest}:`, err)
    }
}

const configPath = path.join(paths.script, paths.configFile)
const configBuffer = fs.readFileSync(configPath)
const config = JSON.parse(configBuffer.toString())

function copyStaticAssets() {
    const stylesSrc = path.join(paths.script, paths.styles)
    const stylesDest = path.join(paths.script, paths.publicStyles)
    if (fs.existsSync(stylesSrc)) {
        copyFiles(stylesSrc, stylesDest)
        console.log(`Diretório de estilos ${stylesSrc} copiado com sucesso!`)
    } else {
        console.error(`Diretório de estilos não encontrado:`, stylesSrc)
    }
    
    const imagesSrc = path.join(paths.script, paths.images)
    const imagesDest = path.join(paths.script, paths.publicImages)
    if (fs.existsSync(imagesSrc)) {
        copyFiles(imagesSrc, imagesDest)
        console.log(`Diretório de imagens ${imagesSrc} copiado com sucesso!`)
    } else {
        console.error(`Diretório de imagens não encontrado:`, imagesSrc)
    }

    const faviconSrc = path.join(paths.script, paths.favicons)
    const faviconDest = path.join(paths.script, paths.publicFavicons)
    if (fs.existsSync(faviconSrc)) {
        copyFiles(faviconSrc, faviconDest)
        console.log(`Diretório de favicons ${faviconSrc} copiado com sucesso!`)
    } else {
        console.error(`Diretório de favicons não encontrado:`, faviconSrc)
    }
    
    const htmlSrc = path.join(paths.script, paths.staticHtml)
    const htmlDest = path.join(paths.script, paths.public)
    if (fs.existsSync(htmlSrc)) {
        copyFiles(htmlSrc, htmlDest)
        console.log(`Diretório de HTML estáticos ${htmlSrc} copiado com sucesso!`)
    } else {
        console.error(`Diretório de HTML estático não encontrado:`, htmlSrc)
    }
}

function replacePlaceholders(template, replacements) {
    let content = template
    Object.keys(replacements).forEach(key => {
        const placeholder = `{{${key}}}`
        content = content.split(placeholder).join(replacements[key])
    })
    return content
}

function calculateBasePath(outputFilePath, publicDir) {
    const relativePath = path.relative(path.dirname(outputFilePath), publicDir)
    return relativePath ? `${relativePath}/` : './'
}

function processMarkdown() {
    config.pages.forEach(page => {
        const markdownFile = path.join(paths.script, paths.markdown, page.file)
        const templateFile = path.join(paths.script, paths.templates, page.template || config.defaultTemplate)
        const outputFile = path.join(paths.script, paths.public, page.output)
        
        const outputDir = path.dirname(outputFile)
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }

        try {
            const markdownContent = fs.readFileSync(markdownFile, 'utf8')
            const htmlContent = markdownIt().render(markdownContent)
            const templateContent = fs.readFileSync(templateFile, 'utf8')

            const publicDir = path.join(paths.script, paths.public)
            const basePath = calculateBasePath(outputFile, publicDir)

            const replacements = {
                title: page.title,
                content: htmlContent,
                basePath: basePath,
                ...page.metadata || {},
            }
            
            const finalContent = replacePlaceholders(templateContent, replacements)

            fs.writeFileSync(outputFile, finalContent, 'utf8')
            console.log(`Arquivo ${page.output} gerado com sucesso!`)
        } catch (err) {
            console.error(`Erro ao processar ${page.file}:`, err)
            return
        }
    })
}

copyStaticAssets()
processMarkdown()
