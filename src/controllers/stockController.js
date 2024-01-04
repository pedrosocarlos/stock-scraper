const connection = require('../database/connection');
const axios = require('axios')
const cheerio = require('cheerio')

const url = 'https://www.fundamentus.com.br/resultado.php'

const accentsMap = new Map([
  ["A", "Á|À|Ã|Â|Ä"],
  ["a", "á|à|ã|â|ä"],
  ["E", "É|È|Ê|Ë"],
  ["e", "é|è|ê|ë"],
  ["I", "Í|Ì|Î|Ï"],
  ["i", "í|ì|î|ï"],
  ["O", "Ó|Ò|Ô|Õ|Ö"],
  ["o", "ó|ò|ô|õ|ö"],
  ["U", "Ú|Ù|Û|Ü"],
  ["u", "ú|ù|û|ü"],
  ["C", "Ç"],
  ["c", "ç"],
  ["N", "Ñ"],
  ["n", "ñ"]
]);

const reducer = (acc, [key]) => acc.replace(new RegExp(accentsMap.get(key), "g"), key);

const removeAccents = (text) => [...accentsMap].reduce(reducer, text);

async function checkNameInDB(ticker) {
  const result = await connection('stocks').whereLike('ticker', '%' + ticker.substring(0, 4) + '%').select('*');

  if (!result) { return false }

  return true
}

module.exports = {
  async index(request, response) {
    const stocks = await connection('stocks').select('*').limit(10);
    if (stocks.length == 0) return response.status(204).send();

    return response.json(stocks);
  },

  async create(request, response) {
    try {
      await axios(url).then(async response => {
        const html = response.data
        const $ = cheerio.load(html)

        $('tr', html).each(async function () {
          const title = $(this).find('span').attr('title')

          //importa o dado 2 e 15 16
          let data = $(this).text()
          data = data.split("\n")

          const ticker = data[1].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");
          const p_l = data[3].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");
          const div_yield = data[6].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");
          const roic = data[16].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");
          const roe = data[17].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");
          const ev_ebit = data[11].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");

          let liq = data[18].replace(/(\r\n\t|\n|\r|\t|%)/gm, "");
          liq = parseFloat(liq.replaceAll(".", "").replace(",", "."))

          let plFinal = parseFloat(p_l.replaceAll(".", "").replace(",", "."))

          if (Number(liq) >= 1000000 && plFinal > 0) {
            /* console.log("-------------")
            console.log(title)
            console.log(ticker)
            console.log(liq)
            console.log(plFinal) */

            await connection('stocks').insert({
              title: title.replace(/(\r\n\t|\n|\r|\t|%)/gm, ""),
              ticker: ticker,
              div_yield: parseFloat(div_yield.replaceAll(".", "").replace(",", ".")),
              p_l: parseFloat(p_l.replaceAll(".", "").replace(",", ".")),
              roe: parseFloat(roe.replaceAll(".", "").replace(",", ".")),
              roic: parseFloat(roic.replaceAll(".", "").replace(",", ".")),
              ev_ebit: parseFloat(ev_ebit.replaceAll(".", "").replace(",", "."))
            })
          }
        })
      }).catch(err => console.log(err))
    }
    catch (err) {
      console.log(err)
      return response.status(400).send();
    }

    return response.json({ message: "deu tudo certo amigo" });
  },

  async delete(request, response) {
    const { id } = request.params;

    const stocks = await connection('stocks').where('id', id);
    if (!stocks) {
      return response.status(404).json({ error: 'not found' });
    }

    await connection('stocks').where('id', id).delete();

    return response.status(204).send();
  },

  async deleteAll(request, response) {
    await connection('stocks').delete();

    return response.status(204).send();
  },

  async orderResults(request, response) {
    const stocks = await connection('stocks').select('*');
    console.log(stocks.length)

    const uni = stocks.sort((a, b) => a.ev_ebit - b.ev_ebit)
    //stocks.sort((a, b) => (a.p_l > b.p_l) ? 1 : ((b.p_l > a.p_l) ? -1 : 0))
    //=> a.p_l - b.p_l
    for (var i = 0; i < stocks.length; i++) {
      uni[i].rank_ev_ebit = i + 1
    }

    const duni = stocks.sort((a, b) => b.roic - a.roic)
    //stocks.sort((a, b) => (a.roe > b.roe) ? 1 : ((b.roe > a.roe) ? -1 : 0))
    for (var v = 0; v < stocks.length; v++) {
      duni[v].rank_roic = v + 1
    }

    for (var k = 0; k < stocks.length; k++) {
      stocks[k].rank_roic = duni[k].rank_roic
      stocks[k].rank_ev_ebit = uni[k].rank_ev_ebit
      stocks[k].rank_final = duni[k].rank_roic + uni[k].rank_ev_ebit
    }

    await connection('stocks').delete();

    for (var l = 0; l < stocks.length; l++) {
      await connection('stocks').insert({
        title: stocks[l].title,
        ticker: stocks[l].ticker,
        div_yield: stocks[l].div_yield = ! null ? stocks[l].div_yield : 0,
        p_l: stocks[l].p_l,
        ev_ebit: stocks[l].ev_ebit,
        roe: stocks[l].roe,
        roic: stocks[l].roic,
        rank_ev_ebit: stocks[l].rank_ev_ebit,
        rank_roic: stocks[l].rank_roic,
        rank_final: stocks[l].rank_final
      })
    }

    return response.status(204).send();
  },

  async getResults(request, response) {
    const { id } = request.params;

    const stocks = await connection('stocks').select('*').limit(id).orderBy('rank_final');

    let final_list = []
    console.log(stocks.length)

    let new_array = stocks.filter(async function (element) { await checkNameInDB(element.ticker) !== false })


    /* await stocks.forEach(async element => {
      const tiker = await checkNameInDB(element.ticker)

      if (tiker) { final_list.push(element) }
    }); */

    console.log(new_array)
    console.log(new_array.length)

    return response.json(new_array);
  },

  async getOrders(request, response) {
    const rank_ev_ebit = await connection('stocks').select('*').limit(10).orderBy('rank_ev_ebit');

    const rank_roic = await connection('stocks').select('*').limit(10).orderBy('rank_roic');

    return response.json({
      rank_ev_ebit: rank_ev_ebit,
      rank_roic: rank_roic
    });
  },

  async selectName(request, response) {
    const { message } = request.body;

    const result = await connection('stocks').whereLike('ticker', '%' + message + '%').select('*');
    if (!result) {
      return response.status(404).json({ error: 'not found' });
    }

    return response.json(result);
  },

  async cleanName(string) {
    var diacritics = [
      { char: 'A', base: /[\300-\306]/g },
      { char: 'a', base: /[\340-\346]/g },
      { char: 'E', base: /[\310-\313]/g },
      { char: 'e', base: /[\350-\353]/g },
      { char: 'I', base: /[\314-\317]/g },
      { char: 'i', base: /[\354-\357]/g },
      { char: 'O', base: /[\322-\330]/g },
      { char: 'o', base: /[\362-\370]/g },
      { char: 'U', base: /[\331-\334]/g },
      { char: 'u', base: /[\371-\374]/g },
      { char: 'N', base: /[\321]/g },
      { char: 'n', base: /[\361]/g },
      { char: 'C', base: /[\307]/g },
      { char: 'c', base: /[\347]/g }
    ]

    diacritics.forEach(function (letter) {
      str = str.replace(letter.base, letter.char);
    });

    return str;
  }
}