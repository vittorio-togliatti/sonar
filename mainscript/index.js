const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const urls = [
    "corriere",
    "repubblica",
];

function cargarConfiguracion(codigo) {
    const fileName = codigo.endsWith(".json") ? codigo : `${codigo}.json`;
    const configPath = path.join(__dirname, "config", fileName);
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

async function extraerTitulos(codigo) {
    let url = "";
    try {
        const config = cargarConfiguracion(codigo);
        url = config.url || (config.startUrls && config.startUrls[0]);
        const titleSelector = config.article?.title || config.titleSelector || "a";

        if (!url) {
            throw new Error(`No se encontró URL configurada para ${codigo}`);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const titulos = [];

        $(titleSelector).each((_, elemento) => {
            const titulo = $(elemento).text().trim();

            if (titulo) {
                titulos.push(titulo);
            }
        });

        return {
            media: config.name || codigo,
            url,
            titulos,
        };
    } catch (error) {
        console.error(`Error leyendo ${codigo}:`, error.message);

        return {
            media: codigo,
            url,
            titulos: [],
            error: error.message,
        };
    }
}

async function main() {
    const resultados = [];

    for (const codigo of urls) {
        console.log(`Leyendo: ${codigo}`);

        const resultado = await extraerTitulos(codigo);
        resultados.push(resultado);
    }

    fs.writeFileSync(
        "titulos.json",
        JSON.stringify(resultados, null, 2),
        "utf8"
    );

    console.log("Títulos guardados en titulos.json");
}

main();