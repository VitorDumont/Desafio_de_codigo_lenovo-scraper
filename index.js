const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORTA = 3000;

// Função para extrair laptops do site
async function extrairLaptopsDaPagina(numeroPagina) {
  const url = `https://webscraper.io/test-sites/e-commerce/static/computers/laptops?page=${numeroPagina}`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const laptops = [];

  $('.thumbnail').each((index, elemento) => {
    // Extraindo o nome do produto 
    const titulo = $(elemento).find('.title').attr('title').trim();

    // Extraindo o preço 
    const preco = parseFloat($(elemento).find('.price').text().replace('$', ''));

    // Extraindo a descrição
    const descricao = $(elemento).find('.description').text().trim();

    // Extraindo o número de reviews 
    const textoReviews = $(elemento).find('.review-count.float-end').text().trim();
    const reviews = textoReviews ? parseInt(textoReviews.match(/\d+/)) : 0;

    // Extraindo a avaliação (número de estrelas)
    const avaliacao = $(elemento).find('p[data-rating]').attr('data-rating');
    const estrelas = avaliacao ? parseInt(avaliacao) : 0;

    // Adiciona os detalhes do laptop ao array
    laptops.push({
      titulo,
      preco,
      descricao,
      reviews,
      estrelas
    });
  });

  return laptops;
}

// Rota para capturar os laptops da Lenovo 
app.get('/laptops-lenovo', async (req, res) => {
  try {
    const laptopsLenovo = [];
    let numeroPagina = 1;

    
    while (true) {
      
      const laptopsDaPagina = await extrairLaptopsDaPagina(numeroPagina);

      // Se não tiver mais laptops, o loop para
      if (laptopsDaPagina.length === 0) {
        break;
      }

      // Filtra apenas os laptops que têm "Lenovo" no título
      const laptopsFiltrados = laptopsDaPagina.filter(laptop =>
        laptop.titulo.toLowerCase().includes('lenovo')
      );

      // Adiciona os laptops Lenovo ao array total
      laptopsLenovo.push(...laptopsFiltrados);
      numeroPagina++; // Vai para a próxima página
    }

    // Ordena os produtos pelo preço (do mais barato para o mais caro)
    laptopsLenovo.sort((a, b) => a.preco - b.preco);

    // Retorna o array de laptops Lenovo como JSON
    res.json(laptopsLenovo);

  } catch (error) {
    console.error(error);
    res.status(500).send('Não foi possivel coletar os dados.');
  }
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});
