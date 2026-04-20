const grid = document.getElementById('jogosGrid');
const estadoVazio = document.getElementById('estadoVazio');
const btnAdicionar = document.getElementById('btnAdicionar');

const modalDetalhes = document.getElementById('modalDetalhes');
const modalAdicionar = document.getElementById('modalAdicionar');
const formAdicionar = document.getElementById('formAdicionar');
const erroFormulario = document.getElementById('erroFormulario');

const fallbackCapa =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="100%" height="100%" fill="%231b2130"/><text x="50%" y="50%" fill="%23aab4cd" font-size="20" text-anchor="middle" dominant-baseline="middle">Sem capa</text></svg>';

let jogos = [];

function proximoId(lista) {
  const maiorId = lista.reduce((max, jogo) => Math.max(max, Number(jogo.id) || 0), 0);
  return maiorId + 1;
}

function criarCard(jogo) {
  const card = document.createElement('article');
  card.className = `card-jogo ${jogo.zerado ? 'zerado' : ''}`;
  card.dataset.id = String(jogo.id);

  const capa = document.createElement('img');
  capa.src = jogo.imagem || fallbackCapa;
  capa.alt = `Capa do jogo ${jogo.nome}`;
  capa.loading = 'lazy';
  capa.onerror = () => {
    capa.src = fallbackCapa;
  };

  const nome = document.createElement('h3');
  nome.textContent = jogo.nome;

  card.append(capa, nome);
  card.addEventListener('click', () => abrirDetalhes(jogo.id));

  return card;
}

function atualizarEstadoVazio() {
  estadoVazio.classList.toggle('hidden', jogos.length > 0);
}

function renderizarInicial() {
  grid.innerHTML = '';
  jogos.forEach((jogo) => grid.appendChild(criarCard(jogo)));
  atualizarEstadoVazio();
}

function inserirCard(jogo) {
  grid.appendChild(criarCard(jogo));
  atualizarEstadoVazio();
}

function abrirDetalhes(id) {
  const jogo = jogos.find((item) => item.id === id);
  if (!jogo) return;

  const detImagem = document.getElementById('detImagem');
  detImagem.src = jogo.imagem || fallbackCapa;
  detImagem.onerror = () => {
    detImagem.src = fallbackCapa;
  };

  document.getElementById('detNome').textContent = jogo.nome;
  document.getElementById('detTempo').textContent = `${jogo.tempo} horas`;
  document.getElementById('detNota').textContent =
    jogo.nota === null || jogo.nota === '' ? 'Não informada' : String(jogo.nota);
  document.getElementById('detStatus').textContent = jogo.zerado
    ? 'Zerado ✅'
    : 'Em progresso ⏳';
  document.getElementById('detComentario').textContent =
    jogo.comentario || 'Sem feedback.';

  modalDetalhes.showModal();
}

function fecharModais() {
  modalDetalhes.close();
  modalAdicionar.close();
}

function validarFormulario(dados) {
  const nome = String(dados.get('nome') || '').trim();
  const imagem = String(dados.get('imagem') || '').trim();
  const tempo = Number(dados.get('tempo'));
  const notaRaw = String(dados.get('nota') || '').trim();
  const comentario = String(dados.get('comentario') || '').trim();
  const zerado = dados.get('zerado') === 'on';

  if (nome.length < 2) {
    return { erro: 'Nome deve ter pelo menos 2 caracteres.' };
  }

  if (!Number.isFinite(tempo) || tempo < 0) {
    return { erro: 'Tempo jogado deve ser um número maior ou igual a 0.' };
  }

  let nota = null;
  if (notaRaw !== '') {
    nota = Number(notaRaw);
    if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
      return { erro: 'Nota deve estar entre 0 e 10.' };
    }
  }

  return {
    erro: null,
    jogo: {
      id: proximoId(jogos),
      nome,
      imagem,
      tempo,
      nota,
      comentario,
      zerado
    }
  };
}

async function salvarDados() {
  jogos = await window.jogosAPI.salvarJogos(jogos);
}

async function onSubmitAdicionar(event) {
  event.preventDefault();
  erroFormulario.classList.add('hidden');

  const dados = new FormData(formAdicionar);
  const { erro, jogo } = validarFormulario(dados);

  if (erro) {
    erroFormulario.textContent = erro;
    erroFormulario.classList.remove('hidden');
    return;
  }

  jogos.push(jogo);

  try {
    await salvarDados();
    inserirCard(jogo);
    formAdicionar.reset();
    modalAdicionar.close();
  } catch (error) {
    jogos = jogos.filter((item) => item.id !== jogo.id);
    erroFormulario.textContent = 'Falha ao salvar dados. Tente novamente.';
    erroFormulario.classList.remove('hidden');
    console.error(error);
  }
}

async function iniciar() {
  jogos = await window.jogosAPI.carregarJogos();
  renderizarInicial();

  btnAdicionar.addEventListener('click', () => modalAdicionar.showModal());
  formAdicionar.addEventListener('submit', onSubmitAdicionar);
  document
    .getElementById('cancelarAdicionar')
    .addEventListener('click', () => modalAdicionar.close());
  document.getElementById('fecharDetalhes').addEventListener('click', fecharModais);

  [modalDetalhes, modalAdicionar].forEach((modal) => {
    modal.addEventListener('click', (event) => {
      const rect = modal.getBoundingClientRect();
      const clicouFora =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (clicouFora) {
        modal.close();
      }
    });
  });
}

iniciar();
