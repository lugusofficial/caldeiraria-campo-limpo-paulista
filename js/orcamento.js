// Pedido de orcamento: o site e estatico, entao o formulario monta um e-mail ja preenchido
// com os dados tecnicos e abre o programa de e-mail de quem pediu. Sem script o formulario
// nao envia nada, e os contatos ao lado continuam valendo.
(function () {
  'use strict';
  var form = document.querySelector('form[data-orcamento]');
  if (!form) { return; }
  var status = form.querySelector('.form-status');
  var DESTINO = 'contato@example.com';

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var invalido = form.querySelector(':invalid');
    if (invalido) {
      if (status) { status.textContent = 'Preencha nome e telefone para enviar.'; }
      invalido.focus();
      return;
    }
    var v = function (nome) { var c = form.elements[nome]; return c ? c.value.trim() : ''; };
    var linhas = [
      'Pedido de orçamento: ' + v('equipamento'),
      '',
      'Nome: ' + v('nome'),
      'Empresa: ' + (v('empresa') || 'não informada'),
      'Telefone: ' + v('telefone'),
      'E-mail: ' + (v('email') || 'não informado'),
      '',
      'Detalhes:',
      v('detalhes') || 'a combinar'
    ];
    var assunto = 'Orçamento: ' + v('equipamento') + (v('empresa') ? ' para ' + v('empresa') : '');
    window.location.href = 'mailto:' + DESTINO + '?subject=' + encodeURIComponent(assunto) +
      '&body=' + encodeURIComponent(linhas.join('\n'));
    if (status) { status.textContent = 'Abrimos o seu e-mail com o pedido pronto. É só enviar.'; }
  });
})();
