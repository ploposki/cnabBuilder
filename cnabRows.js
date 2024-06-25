'use strict';
import path from 'path'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url';

import yargs from 'yargs'
import chalk from 'chalk'

const optionsYargs = yargs(process.argv.slice(2))
  .usage('Uso: $0 [options]')
  .option("p", { alias: "path", describe: "caminho absoluto contendo o nome do arquivo Cnab", type: "string", demandOption: false })
  .option("e", { alias: "search", describe: "campo que filtra pelas empresas dentro do Cnab", type: "string", demandOption: false })
  .option("f", { alias: "from", describe: "posição inicial de pesquisa da linha do Cnab", type: "number", demandOption: true })
  .option("t", { alias: "to", describe: "posição final de pesquisa da linha do Cnab", type: "number", demandOption: true })
  .option("s", { alias: "segmento", describe: "tipo de segmento", type: "string", demandOption: true })
  .option("j", { alias: "json", describe: "informe se deseja exportar arquivo json do Cnab", type: "boolean", demandOption: true })
  .example('$0 -f 21 -t 34 -s p j true', 'lista a linha e campo que from e to do cnab')
  .argv;

const { path: filePath, search, from, to, segmento, json } = optionsYargs

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __pathname = filePath || `${__dirname}/cnabExample.rem`;
const file = path.resolve(__pathname)

const messageLog = (index, empresa, segmento, segmentoType, from, to) => `
----- Cnab linha ${index}/${segmentoType} -----

arquivo utilizado: ${chalk.inverse.bgBlack(__pathname)}

posição from: ${chalk.inverse.bgBlack(from)}

posição to: ${chalk.inverse.bgBlack(to)}

item isolado: ${chalk.inverse.bgBlack(segmento.substring(from - 1, to))}

item dentro da linha: 
  ${segmento.substring(0, from)}${chalk.inverse.bgBlack(segmento.substring(from - 1, to))}${segmento.substring(to)}

empresa desse segmento: ${chalk.inverse.bgBlack(empresa)}
obs: a posição dessa informação sempre se encontra em Q (33, 73)

----- FIM ------
`

const log = console.log

console.time('leitura Async')

readFile(file, 'utf8')
  .then(file => {
    const cnabArray = file.split('\n')

    cnabArray.splice(0, 2) // remove cnab header
    cnabArray.splice(-2) // remove cnab tail

    const cnabArrayOfJson = []

    for (let i = 0; i < cnabArray.length; i += 3) {
      const cnabBodySegmentoP = cnabArray[i]
      const cnabBodySegmentoQ = cnabArray[i + 1]
      const cnabBodySegmentoR = cnabArray[i + 2]

      const empresa = cnabBodySegmentoQ.substring(33, 73).trim()
      const endereco = cnabBodySegmentoQ.substring(73, 113).trim()
      const bairro = cnabBodySegmentoQ.substring(113, 128).trim()
      const cep = cnabBodySegmentoQ.substring(128, 136).trim()
      const cidade = cnabBodySegmentoQ.substring(136, 151).trim()
      const estado = cnabBodySegmentoQ.substring(151, 153).trim()
      const posicao = `linha ${i}/Q (33, 153)`

      const searchFilter = search ? empresa.toLowerCase().includes(search.toLowerCase()) : true

      if (searchFilter) {        
        cnabArrayOfJson.push({
          empresa,
          endereco,
          bairro,
          cep,
          cidade,
          estado,
          posicao,
        })

        if (segmento === 'p') {
          log(messageLog(i, empresa, cnabBodySegmentoP, 'P', from, to))
        }
  
        if (segmento === 'q') {
          log(messageLog(i, empresa, cnabBodySegmentoQ, 'Q', from, to))
        }
  
        if (segmento === 'r') {
          log(messageLog(i, empresa, cnabBodySegmentoR, 'R', from, to))
        }
      }
    }

    if (json){
      const fileName = `cnab-${new Date().getTime()}.json`
      writeFile(fileName, JSON.stringify(cnabArrayOfJson))
      log(`Cnap exportado em formato json - ${fileName}`)
    }

  })
  .catch(error => {
    console.log("🚀 ~ file: cnabRows.js ~ error", error)
  })
console.timeEnd('leitura Async')
