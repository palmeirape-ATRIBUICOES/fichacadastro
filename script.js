document.addEventListener('DOMContentLoaded', () => {
  
  // Elementos do DOM
  const form = document.getElementById('cadastro-form');
  const printArea = document.getElementById('print-area');
  const btnPrint = document.getElementById('btn-print');
  const toggleHighlights = document.getElementById('toggle-highlights');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const formSections = document.querySelectorAll('.form-section');
  const dependentesContainer = document.getElementById('dependentes-container');

  // ==========================================
  // 1. GERENCIAMENTO DE ABAS
  // ==========================================
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Atualizar botões das abas
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Atualizar seções visíveis
      formSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `tab-${targetTab}`) {
          section.classList.add('active');
        }
      });
    });
  });

  // ==========================================
  // 2. MÁSCARAS DE ENTRADA (MÁSCARAS DE DIGITAÇÃO)
  // ==========================================
  function formatInput(input, type) {
    let value = input.value;
    let digits = value.replace(/\D/g, '');
    let formatted = value;

    switch (type) {
      case 'cpf':
        if (digits.length > 11) digits = digits.slice(0, 11);
        if (digits.length <= 3) formatted = digits;
        else if (digits.length <= 6) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
        else if (digits.length <= 9) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        else formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        break;

      case 'cnpj':
        if (digits.length > 14) digits = digits.slice(0, 14);
        if (digits.length <= 2) formatted = digits;
        else if (digits.length <= 5) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
        else if (digits.length <= 8) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
        else if (digits.length <= 12) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
        else formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
        break;

      case 'cep':
        if (digits.length > 8) digits = digits.slice(0, 8);
        if (digits.length <= 5) formatted = digits;
        else formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
        break;

      case 'pis':
        if (digits.length > 11) digits = digits.slice(0, 11);
        if (digits.length <= 3) formatted = digits;
        else if (digits.length <= 8) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
        else if (digits.length <= 10) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8)}`;
        else formatted = `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8, 10)}-${digits.slice(10)}`;
        break;

      case 'date':
        if (digits.length > 8) digits = digits.slice(0, 8);
        if (digits.length <= 2) formatted = digits;
        else if (digits.length <= 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        else formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        break;

      case 'salario':
        // Se vazio, limpa
        if (!digits) {
          formatted = '';
          break;
        }
        // Trata como centavos para máscara financeira incremental
        let moneyVal = parseFloat(digits) / 100;
        formatted = moneyVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        break;
    }

    // Apenas atualiza o valor se mudou para evitar loop ou cursor pulando
    if (input.value !== formatted) {
      input.value = formatted;
    }
  }

  // Identifica o tipo de máscara com base nas características do elemento
  function getMaskType(input) {
    const id = input.id || '';
    const className = input.className || '';

    if (id === 'input-cnpj') return 'cnpj';
    if (id === 'input-cpf' || className.includes('dep-cpf')) return 'cpf';
    if (id === 'input-cep') return 'cep';
    if (id === 'input-pis') return 'pis';
    if (id === 'input-salario') return 'salario';
    
    if (id.includes('data') || 
        id.includes('nascimento') || 
        id.includes('emissao') || 
        id.includes('expedicao') || 
        className.includes('data') || 
        className.includes('nasc')) {
      return 'date';
    }
    
    return null;
  }

  // Ouvinte de evento de digitação para aplicar máscaras
  form.addEventListener('input', (e) => {
    const input = e.target;
    if (input.tagName === 'INPUT') {
      const maskType = getMaskType(input);
      if (maskType) {
        formatInput(input, maskType);
      }
      
      // Sincroniza o valor com a página de impressão
      syncField(input);
    }
  });

  // Ouvinte para campos de seleção (dropdowns)
  form.addEventListener('change', (e) => {
    if (e.target.tagName === 'SELECT') {
      syncField(e.target);
    }
  });

  // ==========================================
  // 3. SINCRONIZAÇÃO EM TEMPO REAL COM O PREVIEW
  // ==========================================
  function syncField(element) {
    const value = element.value;
    
    // Verifica se o campo pertence a um dependente
    const depCard = element.closest('.dependent-card');
    
    if (depCard) {
      const depIndex = depCard.getAttribute('data-index');
      
      // Determina a propriedade de classe do campo do dependente
      let fieldClass = '';
      element.classList.forEach(cls => {
        if (cls.startsWith('dep-')) {
          fieldClass = cls.replace('dep-', '');
        }
      });

      if (fieldClass) {
        const previewElement = document.getElementById(`p-dep${depIndex}-${fieldClass}`);
        if (previewElement) {
          previewElement.textContent = value || '';
        }
      }
    } else {
      // Campos de dados gerais
      const id = element.id;
      const previewId = id.replace('input-', 'p-');
      const previewElement = document.getElementById(previewId);
      
      if (previewElement) {
        // Se for um select, busca a opção selecionada ou texto limpo
        if (element.tagName === 'SELECT') {
          previewElement.textContent = element.value || '';
        } else {
          previewElement.textContent = value || '';
        }
      }
    }
  }

  // Inicializa todos os campos de visualização (para limpar ou mostrar valores iniciais)
  function initSync() {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      syncField(input);
    });
  }

  // ==========================================
  // 4. SUPORTE PARA LIMPAR DEPENDENTES
  // ==========================================
  form.addEventListener('click', (e) => {
    const clearBtn = e.target.closest('.btn-clear-dep');
    if (clearBtn) {
      const depCard = clearBtn.closest('.dependent-card');
      const inputs = depCard.querySelectorAll('input');
      inputs.forEach(input => {
        input.value = '';
        syncField(input);
      });
    }
  });

  // ==========================================
  // 5. TOGGLE DE MARCAÇÕES AMARELAS
  // ==========================================
  toggleHighlights.addEventListener('change', () => {
    if (toggleHighlights.checked) {
      printArea.classList.add('show-highlights');
    } else {
      printArea.classList.remove('show-highlights');
    }
  });

  // ==========================================
  // 6. AUTO-ESCALAR A FOLHA PREVIEW
  // ==========================================
  function adjustPreviewScale() {
    const paper = document.getElementById('print-area');
    const container = document.querySelector('.paper-container');
    if (!paper || !container) return;
    
    const containerWidth = container.clientWidth;
    // Largura aproximada da página A4 em pixels no navegador (794px para 96 DPI)
    const paperWidth = 794; 
    
    // Deixa uma margem de segurança de 40px
    const targetWidth = containerWidth - 80;
    
    if (targetWidth < paperWidth) {
      const scale = targetWidth / paperWidth;
      paper.style.transform = `scale(${scale})`;
      
      // Corrige a altura restante do container da página escalada
      const paperHeight = 1123; // Altura proporcional do A4 em pixels
      const containerHeight = (paperHeight * scale) + 40;
      container.style.minHeight = `${containerHeight}px`;
    } else {
      paper.style.transform = 'none';
      container.style.minHeight = 'auto';
    }
  }

  // Executa o ajuste de escala no redimensionamento e carregamento
  window.addEventListener('resize', adjustPreviewScale);
  
  // Executa sincronizações e ajustes iniciais
  initSync();
  setTimeout(adjustPreviewScale, 100);

  // ==========================================
  // 7. ACIONAMENTO DE IMPRESSÃO / SALVAR EM PDF
  // ==========================================
  btnPrint.addEventListener('click', () => {
    window.print();
  });

});
