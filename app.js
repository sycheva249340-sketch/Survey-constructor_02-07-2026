const state = {
  libraryData: {
    blocks: [],
    questionTypes: []
  },

  activeLibraryTab: 'blocks',
  librarySearchQuery: '',

  expandedBlockIds: new Set(),
  expandedSubblockIds: new Set(),

  selectedLibraryQuestion: null,
  selectedQuestionType: null,
  selectedQuestionnaireQuestion: null,

  currentEditorQuestion: null,

  questionnaire: {
    blocks: []
  },

  expandedQuestionnaireBlockIds: new Set(),
  expandedQuestionnaireSubblockIds: new Set(),
  expandedQuestionnaireQuestionIds: new Set()
};

const elements = {
  librarySearch: document.getElementById('librarySearch'),
  libraryTabBlocks: document.getElementById('libraryTabBlocks'),
  libraryTabTypes: document.getElementById('libraryTabTypes'),
  libraryContent: document.getElementById('libraryContent'),

  editorEmptyState: document.getElementById('editorEmptyState'),
  questionEditorWrapper: document.getElementById('questionEditorWrapper'),
  questionEditorForm: document.getElementById('questionEditorForm'),

  questionTitle: document.getElementById('questionTitle'),
  questionType: document.getElementById('questionType'),
  questionText: document.getElementById('questionText'),
  questionComment: document.getElementById('questionComment'),
  dynamicFields: document.getElementById('dynamicQuestionFields'),

  addQuestionBtn: document.getElementById('addQuestionBtn'),
  saveQuestionBtn: document.getElementById('saveQuestionBtn'),

  questionnaireEmptyState: document.getElementById('questionnaireEmptyState'),
  questionnaireStructure: document.getElementById('questionnaireStructure'),

  questionnaireTitle: document.getElementById('questionnaireTitle'),
  newQuestionnaireBtn: document.getElementById('newQuestionnaireBtn'),
  clearQuestionnaireBtn: document.getElementById('clearQuestionnaireBtn'),
  checkQuestionnaireBtn: document.getElementById('checkQuestionnaireBtn'),
  previewQuestionnaireBtn: document.getElementById('previewQuestionnaireBtn'),
  exportWordBtn: document.getElementById('exportWordBtn'),

  previewModal: document.getElementById('previewModal'),
  previewContent: document.getElementById('previewContent'),
  closePreviewBtn: document.getElementById('closePreviewBtn')
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadLibraryData();

  bindLibraryEvents();
  bindEditorEvents();
  bindQuestionnaireEvents();
  bindTopbarEvents();

  renderLibrary();
  renderEditor();
  renderQuestionnaire();

  restoreBuilderState();
});

/* =========================
   LOAD DATA
========================= */

async function loadLibraryData() {
  try {
    const response = await fetch('questions.json');

    if (!response.ok) {
      throw new Error(`Не удалось загрузить questions.json: ${response.status}`);
    }

    const data = await response.json();

    state.libraryData.blocks = Array.isArray(data.blocks) ? data.blocks : [];

    state.libraryData.questionTypes = Array.isArray(data.questionTypes)
      ? data.questionTypes
      : getDefaultQuestionTypes();

    if (state.libraryData.blocks.length > 0) {
      const firstBlock = state.libraryData.blocks[0];
      state.expandedBlockIds.add(firstBlock.id);

      if (Array.isArray(firstBlock.subblocks) && firstBlock.subblocks.length > 0) {
        state.expandedSubblockIds.add(
          getLibrarySubblockKey(firstBlock.id, firstBlock.subblocks[0].id)
        );
      }
    }
  } catch (error) {
    console.error(error);

    elements.libraryContent.innerHTML = `
      <div class="empty-state">
        <p>Не удалось загрузить библиотеку вопросов.</p>
      </div>
    `;
  }
}

function getDefaultQuestionTypes() {
  return [
    {
      id: 'info',
      title: 'Информация',
      type: 'info',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'info',
        title: 'Новый информационный блок',
        text: 'Введите текст информационного блока',
        comment: '',
        settings: {}
      }
    },
    {
      id: 'open',
      title: 'Открытый вопрос',
      type: 'open',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'open',
        title: 'Новый открытый вопрос',
        text: 'Введите текст вопроса',
        comment: '',
        settings: {}
      }
    },
    {
      id: 'single',
      title: 'Один вариант ответа',
      type: 'single',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'single',
        title: 'Новый вопрос',
        text: 'Введите текст вопроса',
        options: ['Вариант 1', 'Вариант 2'],
        comment: '',
        settings: {
          hasOtherOption: true,
          hasDontKnow: true
        }
      }
    },
    {
      id: 'multiple',
      title: 'Несколько вариантов ответа',
      type: 'multiple',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'multiple',
        title: 'Новый вопрос',
        text: 'Введите текст вопроса',
        options: ['Вариант 1', 'Вариант 2', 'Вариант 3'],
        comment: '',
        settings: {
          hasOtherOption: true,
          hasDontKnow: true,
          maxSelections: ''
        }
      }
    },
    {
      id: 'scale',
      title: 'Шкала',
      type: 'scale',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'scale',
        title: 'Новый вопрос по шкале',
        text: 'Введите текст вопроса',
        comment: '',
        settings: {
          scaleMin: 1,
          scaleMax: 5,
          leftLabel: '',
          rightLabel: ''
        }
      }
    },
    {
      id: 'matrix',
      title: 'Матрица',
      type: 'matrix',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'matrix',
        title: 'Новая матрица',
        text: 'Введите текст вопроса',
        rows: ['Строка 1', 'Строка 2'],
        columns: ['Колонка 1', 'Колонка 2', 'Колонка 3'],
        comment: '',
        settings: {}
      }
    },
    {
      id: 'ranking',
      title: 'Ранжирование',
      type: 'ranking',
      defaultQuestion: {
        id: createRuntimeId(),
        type: 'ranking',
        title: 'Новый вопрос на ранжирование',
        text: 'Введите текст вопроса',
        options: ['Элемент 1', 'Элемент 2', 'Элемент 3'],
        comment: '',
        settings: {}
      }
    }
  ];
}
/* =========================
   LIBRARY EVENTS
========================= */

function bindLibraryEvents() {
  elements.libraryTabBlocks.addEventListener('click', () => {
    if (state.activeLibraryTab === 'blocks') return;

    state.activeLibraryTab = 'blocks';
    updateLibraryTabs();
    renderLibrary();
  });

  elements.libraryTabTypes.addEventListener('click', () => {
    if (state.activeLibraryTab === 'types') return;

    state.activeLibraryTab = 'types';
    updateLibraryTabs();
    renderLibrary();
  });

  elements.librarySearch.addEventListener('input', (event) => {
    state.librarySearchQuery = event.target.value.trim().toLowerCase();
    renderLibrary();
    saveBuilderState();
  });

  elements.libraryContent.addEventListener('click', handleLibraryContentClick);
}

function handleLibraryContentClick(event) {
  const blockHeader = event.target.closest('[data-role="block-header"]');
  const subblockHeader = event.target.closest('[data-role="subblock-header"]');
  const libraryQuestionBtn = event.target.closest('[data-role="library-question"]');
  const questionTypeBtn = event.target.closest('[data-role="question-type"]');

  if (blockHeader) {
    toggleLibraryBlock(blockHeader.dataset.blockId);
    return;
  }

  if (subblockHeader) {
    toggleLibrarySubblock(
      subblockHeader.dataset.blockId,
      subblockHeader.dataset.subblockId
    );
    return;
  }

  if (libraryQuestionBtn) {
    selectLibraryQuestion(
      libraryQuestionBtn.dataset.blockId,
      libraryQuestionBtn.dataset.subblockId,
      libraryQuestionBtn.dataset.questionId
    );
    return;
  }

  if (questionTypeBtn) {
    selectQuestionType(questionTypeBtn.dataset.typeId);
  }
}

function updateLibraryTabs() {
  elements.libraryTabBlocks.classList.toggle('active', state.activeLibraryTab === 'blocks');
  elements.libraryTabTypes.classList.toggle('active', state.activeLibraryTab === 'types');
}

function toggleLibraryBlock(blockId) {
  if (state.expandedBlockIds.has(blockId)) {
    state.expandedBlockIds.delete(blockId);
  } else {
    state.expandedBlockIds.add(blockId);
  }

  renderLibrary();
  saveBuilderState();
}

function toggleLibrarySubblock(blockId, subblockId) {
  const key = getLibrarySubblockKey(blockId, subblockId);

  if (state.expandedSubblockIds.has(key)) {
    state.expandedSubblockIds.delete(key);
  } else {
    state.expandedSubblockIds.add(key);
  }

  renderLibrary();
  saveBuilderState();
}

function selectLibraryQuestion(blockId, subblockId, questionId) {
  const block = state.libraryData.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);
  const question = subblock?.questions?.find((q) => q.id === questionId);

  if (!question) return;

  state.currentEditorQuestion = normalizeQuestion(deepClone(question));
  state.selectedLibraryQuestion = { blockId, subblockId, questionId };
  state.selectedQuestionType = null;
  state.selectedQuestionnaireQuestion = null;

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  saveBuilderState();
}

function selectQuestionType(typeId) {
  const type = state.libraryData.questionTypes.find((t) => t.id === typeId);
  if (!type) return;

  state.currentEditorQuestion = normalizeQuestion(deepClone(type.defaultQuestion));
  state.currentEditorQuestion.type = type.type;

  if (!state.currentEditorQuestion.id) {
    state.currentEditorQuestion.id = createRuntimeId();
  }

  state.selectedQuestionType = typeId;
  state.selectedLibraryQuestion = null;
  state.selectedQuestionnaireQuestion = null;

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  saveBuilderState();
}

/* =========================
   LIBRARY RENDER
========================= */

function renderLibrary() {
  if (state.activeLibraryTab === 'blocks') {
    renderBlocksLibrary();
  } else {
    renderQuestionTypesLibrary();
  }
}

function renderBlocksLibrary() {
  const filteredBlocks = getFilteredBlocks();
  const autoExpanded = getAutoExpandedLibraryKeys(filteredBlocks);

  if (filteredBlocks.length === 0) {
    elements.libraryContent.innerHTML = `
      <div class="empty-state">
        <p>Ничего не найдено.</p>
      </div>
    `;
    return;
  }

  elements.libraryContent.innerHTML = filteredBlocks
    .map((block) => {
      const isBlockExpanded =
        state.expandedBlockIds.has(block.id) || autoExpanded.blockIds.has(block.id);

      return `
        <div class="library-block">
          <div
            class="library-block-header"
            data-role="block-header"
            data-block-id="${escapeHtml(block.id)}"
          >
            <span class="library-block-title">${escapeHtml(block.title)}</span>
            <span class="library-block-toggle">${isBlockExpanded ? '▾' : '▸'}</span>
          </div>

          ${
            isBlockExpanded
              ? `
                <div class="library-block-questions">
                  ${renderLibrarySubblocks(block, autoExpanded)}
                </div>
              `
              : ''
          }
        </div>
      `;
    })
    .join('');
}

function renderLibrarySubblocks(block, autoExpanded) {
  const subblocks = Array.isArray(block.subblocks) ? block.subblocks : [];
  const hideSingleSubblock = subblocks.length === 1;

  return subblocks
    .map((subblock) => {
      const subblockKey = getLibrarySubblockKey(block.id, subblock.id);
      const isSubblockExpanded =
        state.expandedSubblockIds.has(subblockKey) ||
        autoExpanded.subblockKeys.has(subblockKey);

      const questionsHtml = `
        <div class="library-block-questions">
          ${(subblock.questions || [])
            .map((question) => {
              const isSelected =
                state.selectedLibraryQuestion &&
                state.selectedLibraryQuestion.blockId === block.id &&
                state.selectedLibraryQuestion.subblockId === subblock.id &&
                state.selectedLibraryQuestion.questionId === question.id;

              return `
                <button
                  type="button"
                  class="library-question-btn ${isSelected ? 'active' : ''}"
                  data-role="library-question"
                  data-block-id="${escapeHtml(block.id)}"
                  data-subblock-id="${escapeHtml(subblock.id)}"
                  data-question-id="${escapeHtml(question.id)}"
                >
                  ${escapeHtml(question.title)}
                </button>
              `;
            })
            .join('')}
        </div>
      `;

      if (hideSingleSubblock) {
        return questionsHtml;
      }

      return `
        <div class="library-subblock">
          <div
            class="library-block-header"
            data-role="subblock-header"
            data-block-id="${escapeHtml(block.id)}"
            data-subblock-id="${escapeHtml(subblock.id)}"
          >
            <span class="library-block-title">${escapeHtml(subblock.title)}</span>
            <span class="library-block-toggle">${isSubblockExpanded ? '▾' : '▸'}</span>
          </div>

          ${isSubblockExpanded ? questionsHtml : ''}
        </div>
      `;
    })
    .join('');
}

function renderQuestionTypesLibrary() {
  const filteredTypes = getFilteredQuestionTypes();

  if (filteredTypes.length === 0) {
    elements.libraryContent.innerHTML = `
      <div class="empty-state">
        <p>Ничего не найдено.</p>
      </div>
    `;
    return;
  }

  elements.libraryContent.innerHTML = `
    <div class="list-section">
      ${filteredTypes
        .map((type) => {
          const isSelected = state.selectedQuestionType === type.id;

          return `
            <button
              type="button"
              class="library-type-btn ${isSelected ? 'active' : ''}"
              data-role="question-type"
              data-type-id="${escapeHtml(type.id)}"
            >
              ${escapeHtml(type.title)}
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

function getFilteredBlocks() {
  const query = state.librarySearchQuery;

  if (!query) {
    return state.libraryData.blocks;
  }

  return state.libraryData.blocks
    .map((block) => {
      const blockMatches = textIncludes(block.title, query);

      const filteredSubblocks = (block.subblocks || [])
        .map((subblock) => {
          const subblockMatches = textIncludes(subblock.title, query);

          const filteredQuestions = (subblock.questions || []).filter((question) =>
            questionMatchesSearch(question, query)
          );

          if (subblockMatches) {
            return subblock;
          }

          if (filteredQuestions.length > 0) {
            return {
              ...subblock,
              questions: filteredQuestions
            };
          }

          return null;
        })
        .filter(Boolean);

      if (blockMatches) {
        return block;
      }

      if (filteredSubblocks.length > 0) {
        return {
          ...block,
          subblocks: filteredSubblocks
        };
      }

      return null;
    })
    .filter(Boolean);
}

function getAutoExpandedLibraryKeys(filteredBlocks) {
  const query = state.librarySearchQuery;

  if (!query) {
    return {
      blockIds: new Set(),
      subblockKeys: new Set()
    };
  }

  const blockIds = new Set();
  const subblockKeys = new Set();

  filteredBlocks.forEach((block) => {
    blockIds.add(block.id);

    (block.subblocks || []).forEach((subblock) => {
      subblockKeys.add(getLibrarySubblockKey(block.id, subblock.id));
    });
  });

  return { blockIds, subblockKeys };
}

function getFilteredQuestionTypes() {
  const query = state.librarySearchQuery;

  if (!query) {
    return state.libraryData.questionTypes;
  }

  return state.libraryData.questionTypes.filter((type) =>
    textIncludes(type.title, query)
  );
}
/* =========================
   EDITOR EVENTS
========================= */

function bindEditorEvents() {
  elements.questionTitle.addEventListener('input', (event) => {
    if (!state.currentEditorQuestion) return;
    state.currentEditorQuestion.title = event.target.value;
    syncEditorToQuestionnaireIfNeeded();
    renderQuestionnaire();
    saveBuilderState();
  });

  elements.questionText.addEventListener('input', (event) => {
    if (!state.currentEditorQuestion) return;
    state.currentEditorQuestion.text = event.target.innerHTML;
    syncEditorToQuestionnaireIfNeeded();
    renderQuestionnaire();
    saveBuilderState();
  });

  elements.questionComment.addEventListener('input', (event) => {
    if (!state.currentEditorQuestion) return;
    state.currentEditorQuestion.comment = event.target.value;
    syncEditorToQuestionnaireIfNeeded();
    saveBuilderState();
  });

  elements.dynamicFields.addEventListener('input', handleDynamicFieldsInput);
  elements.dynamicFields.addEventListener('click', handleDynamicFieldsClick);
  elements.dynamicFields.addEventListener('change', handleDynamicFieldsChange);

  elements.addQuestionBtn.addEventListener('click', addCurrentQuestionToQuestionnaire);

  elements.saveQuestionBtn.addEventListener('click', () => {
    syncEditorToQuestionnaireIfNeeded();
    renderQuestionnaire();
    saveBuilderState();
  });
  document.querySelectorAll('.format-toolbar button').forEach((button) => {
  button.addEventListener('click', () => {
    const command = button.dataset.format;
    elements.questionText.focus();
    document.execCommand(command, false, null);

    if (state.currentEditorQuestion) {
      state.currentEditorQuestion.text = elements.questionText.innerHTML;
      syncEditorToQuestionnaireIfNeeded();
      renderQuestionnaire();
      saveBuilderState();
    }
  });
});
}

/* =========================
   EDITOR RENDER
========================= */

function renderEditor() {
  const q = state.currentEditorQuestion;

  if (!q) {
    elements.editorEmptyState.classList.remove('hidden');
    elements.questionEditorWrapper.classList.add('hidden');
    return;
  }

  elements.editorEmptyState.classList.add('hidden');
  elements.questionEditorWrapper.classList.remove('hidden');

  const normalized = normalizeQuestion(q);
  state.currentEditorQuestion = normalized;

  elements.questionTitle.value = normalized.title || '';
  elements.questionType.value = normalized.type || '';
  elements.questionText.innerHTML = normalized.text || '';
  elements.questionComment.value = normalized.comment || '';

  renderDynamicFields(normalized);
}

function renderDynamicFields(q) {
  let html = '';

  if (q.type === 'single' || q.type === 'multiple') {
    html += `
      <div class="subsection-card">
        <h4 class="subsection-title">Варианты ответа</h4>

        <div class="option-list">
          ${(q.options || [])
            .map(
              (opt, i) => `
                <div class="option-row">
                  <input type="text" data-index="${i}" value="${escapeHtml(opt)}" />
                  <button
                    type="button"
                    class="text-action-btn"
                    data-action="remove-option"
                    data-index="${i}"
                  >
                    Удалить
                  </button>
                </div>
              `
            )
            .join('')}
        </div>

        <button type="button" class="inline-action-btn" data-action="add-option">
          + Добавить вариант
        </button>

        <div class="checkbox-group">
          <label class="checkbox-row">
            <input type="checkbox" id="hasOtherOption" ${q.settings?.hasOtherOption ? 'checked' : ''}/>
            Другое (укажите)
          </label>

          <label class="checkbox-row">
            <input type="checkbox" id="hasDontKnow" ${q.settings?.hasDontKnow ? 'checked' : ''}/>
            Затрудняюсь ответить
          </label>
        </div>
      </div>
    `;
  }

  if (q.type === 'multiple') {
    html += `
      <div class="subsection-card">
        <h4 class="subsection-title">Настройки выбора</h4>
        <input
          type="number"
          id="maxSelections"
          value="${q.settings?.maxSelections || ''}"
          placeholder="Максимум вариантов"
        />
      </div>
    `;
  }

  if (q.type === 'scale') {
    html += `
      <div class="subsection-card">
        <h4 class="subsection-title">Шкала</h4>

        <div class="inline-field-group">
          <input type="number" id="scaleMin" value="${q.settings?.scaleMin ?? ''}" placeholder="Минимум"/>
          <input type="number" id="scaleMax" value="${q.settings?.scaleMax ?? ''}" placeholder="Максимум"/>
        </div>

        <input type="text" id="leftLabel" value="${escapeHtml(q.settings?.leftLabel || '')}" placeholder="Подпись слева"/>
        <input type="text" id="rightLabel" value="${escapeHtml(q.settings?.rightLabel || '')}" placeholder="Подпись справа"/>
      </div>
    `;
  }

  if (q.type === 'matrix') {
    html += buildSimpleList('Строки', q.rows || [], 'rows');
    html += buildSimpleList('Колонки', q.columns || [], 'columns');
  }

  if (q.type === 'ranking') {
    html += buildSimpleList('Элементы', q.options || [], 'options');
  }

  elements.dynamicFields.innerHTML = html;
}

/* =========================
   EDITOR HANDLERS
========================= */

function handleDynamicFieldsInput(event) {
  const q = state.currentEditorQuestion;
  if (!q) return;

  const target = event.target;
  const index = Number(target.dataset.index);
  const key = target.dataset.key;

  if (q.type === 'single' || q.type === 'multiple') {
    if (target.matches('.option-row input')) {
      q.options[index] = target.value;
    }

    if (target.id === 'maxSelections') {
      q.settings.maxSelections = target.value ? Number(target.value) : '';
    }
  }

  if (q.type === 'scale') {
    if (target.id === 'scaleMin') q.settings.scaleMin = target.value ? Number(target.value) : '';
    if (target.id === 'scaleMax') q.settings.scaleMax = target.value ? Number(target.value) : '';
    if (target.id === 'leftLabel') q.settings.leftLabel = target.value;
    if (target.id === 'rightLabel') q.settings.rightLabel = target.value;
  }

  if (q.type === 'matrix' || q.type === 'ranking') {
    if (target.matches('.simple-list-row input') && key) {
      q[key][index] = target.value;
    }
  }

  syncEditorToQuestionnaireIfNeeded();
  renderQuestionnaire();
  saveBuilderState();
}

function handleDynamicFieldsChange(event) {
  const q = state.currentEditorQuestion;
  if (!q) return;

  if (event.target.id === 'hasOtherOption') {
    q.settings.hasOtherOption = event.target.checked;
  }

  if (event.target.id === 'hasDontKnow') {
    q.settings.hasDontKnow = event.target.checked;
  }

  syncEditorToQuestionnaireIfNeeded();
  renderQuestionnaire();
  saveBuilderState();
}

function handleDynamicFieldsClick(event) {
  const q = state.currentEditorQuestion;
  if (!q) return;

  const btn = event.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const index = Number(btn.dataset.index);

  if (action === 'add-option') {
    q.options.push(`Вариант ${q.options.length + 1}`);
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'remove-option') {
    q.options.splice(index, 1);
    syncEditorToQuestionnaireIfNeeded();
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'add-rows') {
    q.rows.push(`Строка ${q.rows.length + 1}`);
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'remove-rows') {
    q.rows.splice(index, 1);
    syncEditorToQuestionnaireIfNeeded();
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'add-columns') {
    q.columns.push(`Колонка ${q.columns.length + 1}`);
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'remove-columns') {
    q.columns.splice(index, 1);
    syncEditorToQuestionnaireIfNeeded();
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'add-options') {
    q.options.push(`Элемент ${q.options.length + 1}`);
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
    return;
  }

  if (action === 'remove-options') {
    q.options.splice(index, 1);
    syncEditorToQuestionnaireIfNeeded();
    renderEditor();
    renderQuestionnaire();
    saveBuilderState();
  }
}
/* =========================
   QUESTIONNAIRE EVENTS
========================= */

function bindQuestionnaireEvents() {
  elements.questionnaireStructure.addEventListener('click', handleQuestionnaireClick);
}

function handleQuestionnaireClick(event) {
  const actionButton = event.target.closest('[data-role]');
  if (!actionButton) return;

  const role = actionButton.dataset.role;

  if (role === 'duplicate-block') {
    duplicateBlock(actionButton.dataset.blockId);
    return;
  }

  if (role === 'toggle-questionnaire-block') {
    toggleQuestionnaireBlock(actionButton.dataset.blockId);
    return;
  }

  if (role === 'toggle-questionnaire-subblock') {
    toggleQuestionnaireSubblock(
      actionButton.dataset.blockId,
      actionButton.dataset.subblockId
    );
    return;
  }

  if (role === 'toggle-questionnaire-question') {
    toggleQuestionnaireQuestion(
      actionButton.dataset.blockId,
      actionButton.dataset.subblockId,
      actionButton.dataset.questionnaireItemId
    );
    return;
  }

  if (role === 'move-block-up' || role === 'move-block-down') {
    moveBlock(
      Number(actionButton.dataset.blockIndex),
      role === 'move-block-up' ? -1 : 1
    );
    return;
  }

  if (role === 'delete-block') {
    deleteBlock(Number(actionButton.dataset.blockIndex));
    return;
  }

  if (role === 'move-question-up' || role === 'move-question-down') {
    moveQuestion(
      actionButton.dataset.blockId,
      actionButton.dataset.subblockId,
      Number(actionButton.dataset.questionIndex),
      role === 'move-question-up' ? -1 : 1
    );
    return;
  }

  if (role === 'duplicate-question') {
    duplicateQuestion(
      actionButton.dataset.blockId,
      actionButton.dataset.subblockId,
      Number(actionButton.dataset.questionIndex)
    );
    return;
  }

  if (role === 'delete-question') {
    deleteQuestion(
      actionButton.dataset.blockId,
      actionButton.dataset.subblockId,
      Number(actionButton.dataset.questionIndex)
    );
    return;
  }
}

/* =========================
   ADD TO QUESTIONNAIRE
========================= */

function addCurrentQuestionToQuestionnaire() {
  if (!state.currentEditorQuestion) return;

  const questionToAdd = normalizeQuestion(deepClone(state.currentEditorQuestion));
  const sourceLocation = getSourceLocationForCurrentEditorQuestion();

  const blockId = sourceLocation?.block?.id || 'custom';
  const blockTitle = sourceLocation?.block?.title || 'Пользовательские вопросы';
  const subblockId = sourceLocation?.subblock?.id || 'main';
  const subblockTitle = sourceLocation?.subblock?.title || 'Основной';

  let questionnaireBlock = state.questionnaire.blocks.find((block) => block.id === blockId);

  if (!questionnaireBlock) {
    questionnaireBlock = {
      id: blockId,
      title: blockTitle,
      subblocks: []
    };

    state.questionnaire.blocks.push(questionnaireBlock);
  }

  let questionnaireSubblock = questionnaireBlock.subblocks.find(
    (subblock) => subblock.id === subblockId
  );

  if (!questionnaireSubblock) {
    questionnaireSubblock = {
      id: subblockId,
      title: subblockTitle,
      questions: []
    };

    questionnaireBlock.subblocks.push(questionnaireSubblock);
  }

  const displayTitle = getDuplicatedQuestionTitle(
    questionnaireSubblock.questions,
    questionToAdd.title
  );

  const questionnaireQuestion = {
    ...questionToAdd,
    questionnaireItemId: createRuntimeId(),
    sourceQuestionId: questionToAdd.id || null,
    title: displayTitle
  };

  questionnaireSubblock.questions.push(questionnaireQuestion);

  state.expandedQuestionnaireBlockIds.add(questionnaireBlock.id);
  state.expandedQuestionnaireSubblockIds.add(
    getQuestionnaireSubblockKey(questionnaireBlock.id, questionnaireSubblock.id)
  );
  state.expandedQuestionnaireQuestionIds.add(questionnaireQuestion.questionnaireItemId);

  state.selectedQuestionnaireQuestion = {
    blockId: questionnaireBlock.id,
    subblockId: questionnaireSubblock.id,
    questionnaireItemId: questionnaireQuestion.questionnaireItemId
  };

  state.currentEditorQuestion = questionnaireQuestion;

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  saveBuilderState();
}

/* =========================
   QUESTIONNAIRE RENDER
========================= */

function renderQuestionnaire() {
  const blocks = state.questionnaire.blocks;

  if (!blocks.length) {
    elements.questionnaireEmptyState.classList.remove('hidden');
    elements.questionnaireStructure.innerHTML = '';
    return;
  }

  elements.questionnaireEmptyState.classList.add('hidden');

  elements.questionnaireStructure.innerHTML = blocks
    .map((block, blockIndex) => {
      const isBlockExpanded = state.expandedQuestionnaireBlockIds.has(block.id);

      return `
        <div class="questionnaire-block ${isQuestionnaireBlockSelected(block.id) ? 'active' : ''} ${isBlockActive(block.id) ? 'active-block' : ''}">
          <div class="questionnaire-block-header">
            <div class="questionnaire-block-title-wrap">
              <button
                type="button"
                class="icon-btn"
                data-role="toggle-questionnaire-block"
                data-block-id="${escapeHtml(block.id)}"
              >
                ${isBlockExpanded ? '▾' : '▸'}
              </button>

              <div class="questionnaire-block-title">${escapeHtml(block.title)}</div>
            </div>

            <div class="icon-btn-group">
              <button
                type="button"
                class="icon-btn"
                data-role="move-block-up"
                data-block-index="${blockIndex}"
              >
                ↑
              </button>

              <button
                type="button"
                class="icon-btn"
                data-role="move-block-down"
                data-block-index="${blockIndex}"
              >
                ↓
              </button>

              <button
                type="button"
                class="icon-btn"
                data-role="duplicate-block"
                data-block-id="${escapeHtml(block.id)}"
              >
                ⧉
              </button>

              <button
                type="button"
                class="icon-btn icon-btn-danger"
                data-role="delete-block"
                data-block-index="${blockIndex}"
              >
                ×
              </button>
            </div>
          </div>

          ${
            isBlockExpanded
              ? `
                <div class="questionnaire-block-body">
                  ${(block.subblocks || []).map((subblock) => {
                    const subblockKey = getQuestionnaireSubblockKey(block.id, subblock.id);
                    const isSubblockExpanded = state.expandedQuestionnaireSubblockIds.has(subblockKey);

                    return `
                      <div class="questionnaire-subblock">
                        <div
                          class="questionnaire-question-header"
                          data-role="toggle-questionnaire-subblock"
                          data-block-id="${escapeHtml(block.id)}"
                          data-subblock-id="${escapeHtml(subblock.id)}"
                        >
                          <div class="questionnaire-question-title">
                            ${escapeHtml(subblock.title)}
                          </div>

                          <div class="icon-btn-group">
                            <button type="button" class="icon-btn">
                              ${isSubblockExpanded ? '▾' : '▸'}
                            </button>
                          </div>
                        </div>

                        ${
                          isSubblockExpanded
                            ? `
                              <div class="questionnaire-subblock-body">
                                ${(subblock.questions || []).map((question, questionIndex) => {
                                  const normalizedQuestion = normalizeQuestion(question);
                                  const isQuestionExpanded = state.expandedQuestionnaireQuestionIds.has(normalizedQuestion.questionnaireItemId);

                                  return `
                                    <div
                                      class="questionnaire-question ${isQuestionnaireQuestionSelected(normalizedQuestion.questionnaireItemId) ? 'active' : ''}"
                                      draggable="true"
                                      data-role="draggable-question"
                                      data-block-id="${escapeHtml(block.id)}"
                                      data-subblock-id="${escapeHtml(subblock.id)}"
                                      data-question-index="${questionIndex}"
                                    >
                                      <div
                                        class="questionnaire-question-header"
                                        data-role="toggle-questionnaire-question"
                                        data-block-id="${escapeHtml(block.id)}"
                                        data-subblock-id="${escapeHtml(subblock.id)}"
                                        data-questionnaire-item-id="${escapeHtml(normalizedQuestion.questionnaireItemId)}"
                                      >
                                        <div class="question-row">
                                          <div class="questionnaire-question-title">
                                            Q${getQuestionGlobalNumber(normalizedQuestion.questionnaireItemId)}. ${escapeHtml(normalizedQuestion.title)}
                                          </div>

                                          <div class="question-type-badge">
                                            ${escapeHtml(getShortQuestionTypeLabel(normalizedQuestion.type))}
                                          </div>
                                        </div>

                                        <div class="icon-btn-group">
                                          <button
                                            type="button"
                                            class="icon-btn"
                                            data-role="move-question-up"
                                            data-block-id="${escapeHtml(block.id)}"
                                            data-subblock-id="${escapeHtml(subblock.id)}"
                                            data-question-index="${questionIndex}"
                                          >
                                            ↑
                                          </button>

                                          <button
                                            type="button"
                                            class="icon-btn"
                                            data-role="move-question-down"
                                            data-block-id="${escapeHtml(block.id)}"
                                            data-subblock-id="${escapeHtml(subblock.id)}"
                                            data-question-index="${questionIndex}"
                                          >
                                            ↓
                                          </button>

                                          <button
                                            type="button"
                                            class="icon-btn"
                                            data-role="duplicate-question"
                                            data-block-id="${escapeHtml(block.id)}"
                                            data-subblock-id="${escapeHtml(subblock.id)}"
                                            data-question-index="${questionIndex}"
                                          >
                                            ⧉
                                          </button>

                                          <button
                                            type="button"
                                            class="icon-btn icon-btn-danger"
                                            data-role="delete-question"
                                            data-block-id="${escapeHtml(block.id)}"
                                            data-subblock-id="${escapeHtml(subblock.id)}"
                                            data-question-index="${questionIndex}"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      </div>

                                      ${
                                        isQuestionExpanded
                                          ? `
                                            <div class="questionnaire-question-details">
                                              <p class="questionnaire-question-text">
                                                ${escapeHtml(normalizedQuestion.text || '')}
                                              </p>
                                              ${renderQuestionPreviewDetails(normalizedQuestion)}
                                            </div>
                                          `
                                          : ''
                                      }
                                    </div>
                                  `;
                                }).join('')}
                              </div>
                            `
                            : ''
                        }
                      </div>
                    `;
                  }).join('')}
                </div>
              `
              : ''
          }
        </div>
      `;
    })
    .join('');
}

function renderQuestionPreviewDetails(question) {
  const q = normalizeQuestion(question);

  if (q.type === 'single' || q.type === 'multiple' || q.type === 'ranking') {
    const items = [...(q.options || [])];

    if (q.settings?.hasOtherOption) {
      items.push('Другое (укажите)');
    }

    if (q.settings?.hasDontKnow) {
      items.push('Затрудняюсь ответить');
    }

    return `
      <ul class="questionnaire-options">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    `;
  }

  if (q.type === 'scale') {
    return `
      <ul class="questionnaire-options">
        <li>Шкала: ${escapeHtml(q.settings?.scaleMin ?? '')}–${escapeHtml(q.settings?.scaleMax ?? '')}</li>
        ${
          q.settings?.leftLabel || q.settings?.rightLabel
            ? `
              <li>
                ${escapeHtml(q.settings?.leftLabel || '')}
                ${q.settings?.leftLabel || q.settings?.rightLabel ? ' — ' : ''}
                ${escapeHtml(q.settings?.rightLabel || '')}
              </li>
            `
            : ''
        }
      </ul>
    `;
  }

  if (q.type === 'matrix') {
  return renderHtmlMatrixTable(q, 'structure');
}

  if (q.type === 'open') {
    return `<p class="questionnaire-question-text">Открытый вопрос</p>`;
  }

  if (q.type === 'info') {
    return `<p class="questionnaire-question-text">Информационный блок</p>`;
  }

  return '';
}
/* =========================
   QUESTIONNAIRE ACTIONS
========================= */

function toggleQuestionnaireBlock(blockId) {
  if (state.expandedQuestionnaireBlockIds.has(blockId)) {
    state.expandedQuestionnaireBlockIds.delete(blockId);
  } else {
    state.expandedQuestionnaireBlockIds.add(blockId);
  }

  renderQuestionnaire();
  saveBuilderState();
}

function toggleQuestionnaireSubblock(blockId, subblockId) {
  const key = getQuestionnaireSubblockKey(blockId, subblockId);

  if (state.expandedQuestionnaireSubblockIds.has(key)) {
    state.expandedQuestionnaireSubblockIds.delete(key);
  } else {
    state.expandedQuestionnaireSubblockIds.add(key);
  }

  renderQuestionnaire();
  saveBuilderState();
}

function toggleQuestionnaireQuestion(blockId, subblockId, questionnaireItemId) {
  if (state.expandedQuestionnaireQuestionIds.has(questionnaireItemId)) {
    state.expandedQuestionnaireQuestionIds.delete(questionnaireItemId);
  } else {
    state.expandedQuestionnaireQuestionIds.add(questionnaireItemId);
  }

  state.selectedQuestionnaireQuestion = { blockId, subblockId, questionnaireItemId };
  openQuestionnaireQuestionInEditor(blockId, subblockId, questionnaireItemId);

  renderQuestionnaire();
  saveBuilderState();
}

function moveBlock(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= state.questionnaire.blocks.length) return;

  const blocks = state.questionnaire.blocks;
  [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];

  renderQuestionnaire();
  saveBuilderState();
}

function deleteBlock(index) {
  state.questionnaire.blocks.splice(index, 1);
  state.selectedQuestionnaireQuestion = null;

  renderQuestionnaire();
  saveBuilderState();
}

function duplicateBlock(blockId) {
  const blocks = state.questionnaire.blocks;
  const index = blocks.findIndex((b) => b.id === blockId);

  if (index === -1) return;

  const sourceBlock = blocks[index];
  const copy = deepClone(sourceBlock);

  copy.id = createRuntimeId();
  copy.title = `${sourceBlock.title || 'Блок'} (копия)`;

  copy.subblocks = (copy.subblocks || []).map((subblock) => {
    const newSubblockId = createRuntimeId();

    return {
      ...subblock,
      id: newSubblockId,
      questions: (subblock.questions || []).map((question) => ({
        ...deepClone(question),
        questionnaireItemId: createRuntimeId()
      }))
    };
  });

  blocks.splice(index + 1, 0, copy);

  state.expandedQuestionnaireBlockIds.add(copy.id);

  (copy.subblocks || []).forEach((subblock) => {
    state.expandedQuestionnaireSubblockIds.add(
      getQuestionnaireSubblockKey(copy.id, subblock.id)
    );
  });

  renderQuestionnaire();
  saveBuilderState();
}

function moveQuestion(blockId, subblockId, index, direction) {
  const block = state.questionnaire.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);
  if (!subblock) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= subblock.questions.length) return;

  [subblock.questions[index], subblock.questions[newIndex]] =
    [subblock.questions[newIndex], subblock.questions[index]];

  renderQuestionnaire();
  saveBuilderState();
}

function duplicateQuestion(blockId, subblockId, index) {
  const block = state.questionnaire.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);

  if (!subblock) return;

  const sourceQuestion = subblock.questions[index];
  if (!sourceQuestion) return;

  const duplicatedQuestion = normalizeQuestion(deepClone(sourceQuestion));
  duplicatedQuestion.questionnaireItemId = createRuntimeId();
  duplicatedQuestion.title = getDuplicatedQuestionTitle(
    subblock.questions,
    stripDuplicateSuffix(sourceQuestion.title || 'Вопрос')
  );

  subblock.questions.splice(index + 1, 0, duplicatedQuestion);

  state.expandedQuestionnaireBlockIds.add(blockId);
  state.expandedQuestionnaireSubblockIds.add(
    getQuestionnaireSubblockKey(blockId, subblockId)
  );
  state.expandedQuestionnaireQuestionIds.add(duplicatedQuestion.questionnaireItemId);

  state.selectedQuestionnaireQuestion = {
    blockId,
    subblockId,
    questionnaireItemId: duplicatedQuestion.questionnaireItemId
  };

  state.currentEditorQuestion = duplicatedQuestion;

  renderEditor();
  renderQuestionnaire();
  saveBuilderState();
}

function deleteQuestion(blockId, subblockId, index) {
  const block = state.questionnaire.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);
  if (!subblock) return;

  const deleted = subblock.questions[index];
  subblock.questions.splice(index, 1);

  if (subblock.questions.length === 0) {
    block.subblocks = block.subblocks.filter((s) => s.id !== subblockId);
  }

  if (block.subblocks.length === 0) {
    state.questionnaire.blocks = state.questionnaire.blocks.filter((b) => b.id !== blockId);
  }

  if (
    state.selectedQuestionnaireQuestion &&
    state.selectedQuestionnaireQuestion.questionnaireItemId === deleted?.questionnaireItemId
  ) {
    state.selectedQuestionnaireQuestion = null;
    state.currentEditorQuestion = null;
  }

  renderEditor();
  renderQuestionnaire();
  saveBuilderState();
}

function openQuestionnaireQuestionInEditor(blockId, subblockId, questionnaireItemId) {
  const block = state.questionnaire.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);
  const question = subblock?.questions?.find(
    (q) => q.questionnaireItemId === questionnaireItemId
  );

  if (!question) return;

  state.currentEditorQuestion = normalizeQuestion(question);
  state.selectedLibraryQuestion = null;
  state.selectedQuestionType = null;

  renderLibrary();
  renderEditor();
}

function syncEditorToQuestionnaireIfNeeded() {
  if (!state.selectedQuestionnaireQuestion || !state.currentEditorQuestion) return;

  const { blockId, subblockId, questionnaireItemId } = state.selectedQuestionnaireQuestion;
  const block = state.questionnaire.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);
  const questionIndex = subblock?.questions?.findIndex(
    (q) => q.questionnaireItemId === questionnaireItemId
  );

  if (!subblock || questionIndex === -1) return;

  subblock.questions[questionIndex] = state.currentEditorQuestion;
}
/* =========================
   TOPBAR EVENTS
========================= */

function bindTopbarEvents() {
  elements.newQuestionnaireBtn.addEventListener('click', handleNewQuestionnaire);
  elements.clearQuestionnaireBtn.addEventListener('click', handleClearQuestionnaire);
  elements.checkQuestionnaireBtn.addEventListener('click', handleCheckQuestionnaire);
  elements.previewQuestionnaireBtn.addEventListener('click', openPreviewModal);
  elements.exportWordBtn.addEventListener('click', exportQuestionnaireToDocx);
  elements.closePreviewBtn.addEventListener('click', closePreviewModal);

  const overlay = elements.previewModal.querySelector('.modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closePreviewModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePreviewModal();
    }
  });

  elements.questionnaireTitle.addEventListener('input', saveBuilderState);
}

function handleNewQuestionnaire() {
  const confirmed = window.confirm(
    'Создать новую анкету? Все текущие изменения будут потеряны.'
  );

  if (!confirmed) return;

  resetAllQuestionnaireState();
  elements.questionnaireTitle.value = '';
  clearSavedBuilderState();

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  closePreviewModal();
}

function handleClearQuestionnaire() {
  const confirmed = window.confirm(
    'Вы уверены, что хотите очистить текущую анкету?'
  );

  if (!confirmed) return;

  state.currentEditorQuestion = null;
  state.selectedLibraryQuestion = null;
  state.selectedQuestionType = null;
  state.selectedQuestionnaireQuestion = null;

  state.questionnaire = {
    blocks: []
  };

  state.expandedQuestionnaireBlockIds = new Set();
  state.expandedQuestionnaireSubblockIds = new Set();
  state.expandedQuestionnaireQuestionIds = new Set();

  clearSavedBuilderState();

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  closePreviewModal();
}

function resetAllQuestionnaireState() {
  state.activeLibraryTab = 'blocks';
  state.librarySearchQuery = '';
  state.selectedLibraryQuestion = null;
  state.selectedQuestionType = null;
  state.selectedQuestionnaireQuestion = null;
  state.currentEditorQuestion = null;

  state.questionnaire = {
    blocks: []
  };

  state.expandedBlockIds = new Set();
  state.expandedSubblockIds = new Set();
  state.expandedQuestionnaireBlockIds = new Set();
  state.expandedQuestionnaireSubblockIds = new Set();
  state.expandedQuestionnaireQuestionIds = new Set();

  if (state.libraryData.blocks.length > 0) {
    const firstBlock = state.libraryData.blocks[0];
    state.expandedBlockIds.add(firstBlock.id);

    if (Array.isArray(firstBlock.subblocks) && firstBlock.subblocks.length > 0) {
      state.expandedSubblockIds.add(
        getLibrarySubblockKey(firstBlock.id, firstBlock.subblocks[0].id)
      );
    }
  }

  elements.librarySearch.value = '';
  updateLibraryTabs();
}

/* =========================
   PREVIEW
========================= */

function openPreviewModal() {
  renderPreviewContent();
  elements.previewModal.classList.remove('hidden');
}

function closePreviewModal() {
  elements.previewModal.classList.add('hidden');

  const modalTitle = elements.previewModal.querySelector('.modal-header h2');
  if (modalTitle) {
    modalTitle.textContent = 'Предпросмотр анкеты';
  }
}

function renderPreviewContent() {
  const title = elements.questionnaireTitle.value.trim() || 'Без названия';
  const blocks = state.questionnaire.blocks;

  if (!blocks.length) {
    elements.previewContent.innerHTML = `
      <div class="empty-state">
        <p>Анкета пока пуста. Добавьте вопросы из библиотеки.</p>
      </div>
    `;
    return;
  }

  elements.previewContent.innerHTML = `
    <div class="preview-document">
      <h2 class="preview-document-title">${escapeHtml(title)}</h2>

      ${blocks.map((block) => `
        <div class="preview-block">
          <h3 class="preview-block-title">${escapeHtml(block.title)}</h3>

          ${(block.subblocks || []).map((subblock) => `
            <div class="preview-subblock">
              ${(subblock.questions || []).map((question) => {
                const q = normalizeQuestion(question);

                return `
                  <div class="preview-question">
                    <div class="preview-question-title">
                      Q${getQuestionGlobalNumber(q.questionnaireItemId)}. ${escapeHtml(q.title)}
                    </div>

                    <div class="preview-question-text">
                      ${escapeHtml(q.text || '')}
                    </div>

                    ${renderPreviewQuestionContent(q)}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderPreviewQuestionContent(question) {
  const q = normalizeQuestion(question);

  if (q.type === 'single' || q.type === 'multiple' || q.type === 'ranking') {
    const items = [...(q.options || [])];

    if (q.settings?.hasOtherOption) {
      items.push('Другое (укажите)');
    }

    if (q.settings?.hasDontKnow) {
      items.push('Затрудняюсь ответить');
    }

    return `
      <ul class="preview-answer-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    `;
  }
  if (q.type === 'matrix') {
    return renderHtmlMatrixTable(q, 'preview');
  }
  if (q.type === 'scale') {
    return `
      <div class="preview-scale">
        Шкала: ${escapeHtml(q.settings?.scaleMin ?? '')}–${escapeHtml(q.settings?.scaleMax ?? '')}
      </div>
    `;
  }
   if (q.type === 'open') {
    return `<div class="preview-open">Открытый вопрос</div>`;
  }

  if (q.type === 'info') {
    return `<div class="preview-info">Информационный блок</div>`;
  }

  return '';
}

/* =========================
   VALIDATION
========================= */

function handleCheckQuestionnaire() {
  const result = validateQuestionnaire();

  const modalTitle = elements.previewModal.querySelector('.modal-header h2');
  if (modalTitle) {
    modalTitle.textContent = 'Проверка анкеты';
  }

  if (!result.issues.length && !result.warnings.length) {
    elements.previewContent.innerHTML = `
      <div class="validation-success">
        <h3>Анкета выглядит корректно</h3>
        <p>Критичных ошибок и предупреждений не найдено.</p>
      </div>
    `;
  } else {
    elements.previewContent.innerHTML = `
      <div class="validation-result">
        ${
          result.issues.length
            ? `
              <h3>Ошибки</h3>
              <ul>
                ${result.issues.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            `
            : ''
        }

        ${
          result.warnings.length
            ? `
              <h3>Предупреждения</h3>
              <ul>
                ${result.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            `
            : ''
        }
      </div>
    `;
  }

  elements.previewModal.classList.remove('hidden');
}

function validateQuestionnaire() {
  const issues = [];
  const warnings = [];

  const blocks = state.questionnaire.blocks || [];

  if (!blocks.length) {
    issues.push('Анкета пустая. Добавьте хотя бы один вопрос.');
    return { issues, warnings };
  }

  blocks.forEach((block) => {
    (block.subblocks || []).forEach((subblock) => {
      (subblock.questions || []).forEach((question) => {
        const q = normalizeQuestion(question);
        const place = `${block.title} → ${q.title || 'Без названия'}`;

        if (!q.title || !q.title.trim()) {
          issues.push(`${place}: не заполнено название вопроса.`);
        }

        if (!q.text || !q.text.trim()) {
          issues.push(`${place}: не заполнен текст вопроса.`);
        }

        if (['single', 'multiple', 'ranking'].includes(q.type)) {
          const optionCount = (q.options || []).filter(Boolean).length;
          const hasExtraOption = q.settings?.hasOtherOption || q.settings?.hasDontKnow;

          if (optionCount === 0 && !hasExtraOption) {
            issues.push(`${place}: нет вариантов ответа.`);
          }
        }

        if (q.type === 'multiple') {
          const optionCount = (q.options || []).filter(Boolean).length;
          const maxSelections = q.settings?.maxSelections;

          if (maxSelections !== '' && maxSelections !== null && maxSelections !== undefined) {
            if (Number(maxSelections) <= 0) {
              issues.push(`${place}: лимит выбора должен быть больше 0.`);
            }

            if (Number(maxSelections) > optionCount) {
              warnings.push(`${place}: лимит выбора больше количества вариантов ответа.`);
            }
          }
        }

        if (q.type === 'scale') {
          const min = q.settings?.scaleMin;
          const max = q.settings?.scaleMax;

          if (min === '' || max === '' || min === null || max === null || min === undefined || max === undefined) {
            issues.push(`${place}: не заполнены минимум и максимум шкалы.`);
          } else if (Number(min) >= Number(max)) {
            issues.push(`${place}: минимум шкалы должен быть меньше максимума.`);
          }
        }

        if (q.type === 'matrix') {
          if (!(q.rows || []).length) {
            issues.push(`${place}: у матрицы нет строк.`);
          }

          if (!(q.columns || []).length) {
            issues.push(`${place}: у матрицы нет колонок.`);
          }
        }
      });
    });
  });

  return { issues, warnings };
}
/* =========================
   TOPBAR EVENTS
========================= */

function bindTopbarEvents() {
  elements.newQuestionnaireBtn.addEventListener('click', handleNewQuestionnaire);
  elements.clearQuestionnaireBtn.addEventListener('click', handleClearQuestionnaire);
  elements.checkQuestionnaireBtn.addEventListener('click', handleCheckQuestionnaire);
  elements.previewQuestionnaireBtn.addEventListener('click', openPreviewModal);
  elements.exportWordBtn.addEventListener('click', exportQuestionnaireToDocx);
  elements.closePreviewBtn.addEventListener('click', closePreviewModal);

  const overlay = elements.previewModal.querySelector('.modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closePreviewModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePreviewModal();
    }
  });

  elements.questionnaireTitle.addEventListener('input', saveBuilderState);
}

function handleNewQuestionnaire() {
  const confirmed = window.confirm(
    'Создать новую анкету? Все текущие изменения будут потеряны.'
  );

  if (!confirmed) return;

  resetAllQuestionnaireState();
  elements.questionnaireTitle.value = '';
  clearSavedBuilderState();

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  closePreviewModal();
}

function handleClearQuestionnaire() {
  const confirmed = window.confirm(
    'Вы уверены, что хотите очистить текущую анкету?'
  );

  if (!confirmed) return;

  state.currentEditorQuestion = null;
  state.selectedLibraryQuestion = null;
  state.selectedQuestionType = null;
  state.selectedQuestionnaireQuestion = null;

  state.questionnaire = {
    blocks: []
  };

  state.expandedQuestionnaireBlockIds = new Set();
  state.expandedQuestionnaireSubblockIds = new Set();
  state.expandedQuestionnaireQuestionIds = new Set();

  clearSavedBuilderState();

  renderLibrary();
  renderEditor();
  renderQuestionnaire();
  closePreviewModal();
}

function resetAllQuestionnaireState() {
  state.activeLibraryTab = 'blocks';
  state.librarySearchQuery = '';
  state.selectedLibraryQuestion = null;
  state.selectedQuestionType = null;
  state.selectedQuestionnaireQuestion = null;
  state.currentEditorQuestion = null;

  state.questionnaire = {
    blocks: []
  };

  state.expandedBlockIds = new Set();
  state.expandedSubblockIds = new Set();
  state.expandedQuestionnaireBlockIds = new Set();
  state.expandedQuestionnaireSubblockIds = new Set();
  state.expandedQuestionnaireQuestionIds = new Set();

  if (state.libraryData.blocks.length > 0) {
    const firstBlock = state.libraryData.blocks[0];
    state.expandedBlockIds.add(firstBlock.id);

    if (Array.isArray(firstBlock.subblocks) && firstBlock.subblocks.length > 0) {
      state.expandedSubblockIds.add(
        getLibrarySubblockKey(firstBlock.id, firstBlock.subblocks[0].id)
      );
    }
  }

  elements.librarySearch.value = '';
  updateLibraryTabs();
}

/* =========================
   PREVIEW
========================= */

function openPreviewModal() {
  renderPreviewContent();
  elements.previewModal.classList.remove('hidden');
}

function closePreviewModal() {
  elements.previewModal.classList.add('hidden');

  const modalTitle = elements.previewModal.querySelector('.modal-header h2');
  if (modalTitle) {
    modalTitle.textContent = 'Предпросмотр анкеты';
  }
}

function renderPreviewContent() {
  const title = elements.questionnaireTitle.value.trim() || 'Без названия';
  const blocks = state.questionnaire.blocks;

  if (!blocks.length) {
    elements.previewContent.innerHTML = `
      <div class="empty-state">
        <p>Анкета пока пуста. Добавьте вопросы из библиотеки.</p>
      </div>
    `;
    return;
  }

  elements.previewContent.innerHTML = `
    <div class="preview-document">
      <h2 class="preview-document-title">${escapeHtml(title)}</h2>

      ${blocks.map((block) => `
        <div class="preview-block">
          <h3 class="preview-block-title">${escapeHtml(block.title)}</h3>

          ${(block.subblocks || []).map((subblock) => `
            <div class="preview-subblock">
              ${(subblock.questions || []).map((question) => {
                const q = normalizeQuestion(question);

                return `
                  <div class="preview-question">
                    <div class="preview-question-title">
                      Q${getQuestionGlobalNumber(q.questionnaireItemId)}. ${escapeHtml(q.title)}
                    </div>

                    <div class="preview-question-text">
                      ${escapeHtml(q.text || '')}
                    </div>

                    ${renderPreviewQuestionContent(q)}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderPreviewQuestionContent(question) {
  const q = normalizeQuestion(question);

  if (q.type === 'single' || q.type === 'multiple' || q.type === 'ranking') {
    const items = [...(q.options || [])];

    if (q.settings?.hasOtherOption) {
      items.push('Другое (укажите)');
    }

    if (q.settings?.hasDontKnow) {
      items.push('Затрудняюсь ответить');
    }

    return `
      <ul class="preview-answer-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    `;
  }

  if (q.type === 'scale') {
    return `
      <div class="preview-scale">
        Шкала: ${escapeHtml(q.settings?.scaleMin ?? '')}–${escapeHtml(q.settings?.scaleMax ?? '')}
      </div>
    `;
  }

  if (q.type === 'matrix') {
    return `
      <div class="preview-matrix">
        <div><strong>Строки:</strong> ${(q.rows || []).map(escapeHtml).join(', ')}</div>
        <div><strong>Колонки:</strong> ${(q.columns || []).map(escapeHtml).join(', ')}</div>
      </div>
    `;
  }

  if (q.type === 'open') {
    return `<div class="preview-open">Открытый вопрос</div>`;
  }

  if (q.type === 'info') {
    return `<div class="preview-info">Информационный блок</div>`;
  }

  return '';
}

/* =========================
   VALIDATION
========================= */

function handleCheckQuestionnaire() {
  const result = validateQuestionnaire();

  const modalTitle = elements.previewModal.querySelector('.modal-header h2');
  if (modalTitle) {
    modalTitle.textContent = 'Проверка анкеты';
  }

  if (!result.issues.length && !result.warnings.length) {
    elements.previewContent.innerHTML = `
      <div class="validation-success">
        <h3>Анкета выглядит корректно</h3>
        <p>Критичных ошибок и предупреждений не найдено.</p>
      </div>
    `;
  } else {
    elements.previewContent.innerHTML = `
      <div class="validation-result">
        ${
          result.issues.length
            ? `
              <h3>Ошибки</h3>
              <ul>
                ${result.issues.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            `
            : ''
        }

        ${
          result.warnings.length
            ? `
              <h3>Предупреждения</h3>
              <ul>
                ${result.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            `
            : ''
        }
      </div>
    `;
  }

  elements.previewModal.classList.remove('hidden');
}

function validateQuestionnaire() {
  const issues = [];
  const warnings = [];

  const blocks = state.questionnaire.blocks || [];

  if (!blocks.length) {
    issues.push('Анкета пустая. Добавьте хотя бы один вопрос.');
    return { issues, warnings };
  }

  blocks.forEach((block) => {
    (block.subblocks || []).forEach((subblock) => {
      (subblock.questions || []).forEach((question) => {
        const q = normalizeQuestion(question);
        const place = `${block.title} → ${q.title || 'Без названия'}`;

        if (!q.title || !q.title.trim()) {
          issues.push(`${place}: не заполнено название вопроса.`);
        }

        if (!q.text || !q.text.trim()) {
          issues.push(`${place}: не заполнен текст вопроса.`);
        }

        if (['single', 'multiple', 'ranking'].includes(q.type)) {
          const optionCount = (q.options || []).filter(Boolean).length;
          const hasExtraOption = q.settings?.hasOtherOption || q.settings?.hasDontKnow;

          if (optionCount === 0 && !hasExtraOption) {
            issues.push(`${place}: нет вариантов ответа.`);
          }
        }

        if (q.type === 'multiple') {
          const optionCount = (q.options || []).filter(Boolean).length;
          const maxSelections = q.settings?.maxSelections;

          if (maxSelections !== '' && maxSelections !== null && maxSelections !== undefined) {
            if (Number(maxSelections) <= 0) {
              issues.push(`${place}: лимит выбора должен быть больше 0.`);
            }

            if (Number(maxSelections) > optionCount) {
              warnings.push(`${place}: лимит выбора больше количества вариантов ответа.`);
            }
          }
        }

        if (q.type === 'scale') {
          const min = q.settings?.scaleMin;
          const max = q.settings?.scaleMax;

          if (min === '' || max === '' || min === null || max === null || min === undefined || max === undefined) {
            issues.push(`${place}: не заполнены минимум и максимум шкалы.`);
          } else if (Number(min) >= Number(max)) {
            issues.push(`${place}: минимум шкалы должен быть меньше максимума.`);
          }
        }

        if (q.type === 'matrix') {
          if (!(q.rows || []).length) {
            issues.push(`${place}: у матрицы нет строк.`);
          }

          if (!(q.columns || []).length) {
            issues.push(`${place}: у матрицы нет колонок.`);
          }
        }
      });
    });
  });

  return { issues, warnings };
}
/* =========================
   LOCAL STORAGE
========================= */

const STORAGE_KEY = 'questionnaire_builder_state_v1';

function saveBuilderState() {
  try {
    const payload = {
      questionnaireTitle: elements.questionnaireTitle?.value || '',

      activeLibraryTab: state.activeLibraryTab,
      librarySearchQuery: state.librarySearchQuery,

      expandedBlockIds: [...state.expandedBlockIds],
      expandedSubblockIds: [...state.expandedSubblockIds],

      selectedLibraryQuestion: state.selectedLibraryQuestion,
      selectedQuestionType: state.selectedQuestionType,
      selectedQuestionnaireQuestion: state.selectedQuestionnaireQuestion,

      currentEditorQuestion: state.currentEditorQuestion,

      questionnaire: state.questionnaire,

      expandedQuestionnaireBlockIds: [...state.expandedQuestionnaireBlockIds],
      expandedQuestionnaireSubblockIds: [...state.expandedQuestionnaireSubblockIds],
      expandedQuestionnaireQuestionIds: [...state.expandedQuestionnaireQuestionIds]
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
  }
}

function restoreBuilderState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);

    state.activeLibraryTab = saved.activeLibraryTab || 'blocks';
    state.librarySearchQuery = saved.librarySearchQuery || '';

    state.expandedBlockIds = new Set(saved.expandedBlockIds || []);
    state.expandedSubblockIds = new Set(saved.expandedSubblockIds || []);

    state.selectedLibraryQuestion = saved.selectedLibraryQuestion || null;
    state.selectedQuestionType = saved.selectedQuestionType || null;
    state.selectedQuestionnaireQuestion = saved.selectedQuestionnaireQuestion || null;

    state.currentEditorQuestion = saved.currentEditorQuestion
      ? normalizeQuestion(saved.currentEditorQuestion)
      : null;

    state.questionnaire = saved.questionnaire || { blocks: [] };
    normalizeQuestionnaireState();

    state.expandedQuestionnaireBlockIds = new Set(saved.expandedQuestionnaireBlockIds || []);
    state.expandedQuestionnaireSubblockIds = new Set(saved.expandedQuestionnaireSubblockIds || []);
    state.expandedQuestionnaireQuestionIds = new Set(saved.expandedQuestionnaireQuestionIds || []);

    if (elements.questionnaireTitle) {
      elements.questionnaireTitle.value = saved.questionnaireTitle || '';
    }

    if (elements.librarySearch) {
      elements.librarySearch.value = state.librarySearchQuery || '';
    }

    updateLibraryTabs();
    renderLibrary();
    renderEditor();
    renderQuestionnaire();
  } catch (error) {
    console.error('Ошибка восстановления из localStorage:', error);
  }
}

function clearSavedBuilderState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Ошибка очистки localStorage:', error);
  }
}

/* =========================
   DRAG & DROP QUESTIONS
========================= */

let draggedQuestionData = null;

document.addEventListener('dragstart', (event) => {
  const item = event.target.closest('[data-role="draggable-question"]');
  if (!item) return;

  draggedQuestionData = {
    blockId: item.dataset.blockId,
    subblockId: item.dataset.subblockId,
    questionIndex: Number(item.dataset.questionIndex)
  };

  item.classList.add('dragging');

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
});

document.addEventListener('dragend', (event) => {
  const item = event.target.closest('[data-role="draggable-question"]');

  if (item) {
    item.classList.remove('dragging');
  }

  draggedQuestionData = null;

  document
    .querySelectorAll('.drag-over')
    .forEach((el) => el.classList.remove('drag-over'));
});

document.addEventListener('dragover', (event) => {
  const item = event.target.closest('[data-role="draggable-question"]');
  if (!item || !draggedQuestionData) return;

  const targetData = {
    blockId: item.dataset.blockId,
    subblockId: item.dataset.subblockId,
    questionIndex: Number(item.dataset.questionIndex)
  };

  if (
    draggedQuestionData.blockId !== targetData.blockId ||
    draggedQuestionData.subblockId !== targetData.subblockId
  ) {
    return;
  }

  event.preventDefault();

  document
    .querySelectorAll('.drag-over')
    .forEach((el) => el.classList.remove('drag-over'));

  item.classList.add('drag-over');
});

document.addEventListener('drop', (event) => {
  const item = event.target.closest('[data-role="draggable-question"]');
  if (!item || !draggedQuestionData) return;

  const targetData = {
    blockId: item.dataset.blockId,
    subblockId: item.dataset.subblockId,
    questionIndex: Number(item.dataset.questionIndex)
  };

  if (
    draggedQuestionData.blockId !== targetData.blockId ||
    draggedQuestionData.subblockId !== targetData.subblockId
  ) {
    return;
  }

  event.preventDefault();

  reorderQuestionByDrag(
    draggedQuestionData.blockId,
    draggedQuestionData.subblockId,
    draggedQuestionData.questionIndex,
    targetData.questionIndex
  );

  draggedQuestionData = null;
});

function reorderQuestionByDrag(blockId, subblockId, fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  const block = state.questionnaire.blocks.find((b) => b.id === blockId);
  const subblock = block?.subblocks?.find((s) => s.id === subblockId);

  if (!subblock) return;

  const questions = subblock.questions;
  const [movedQuestion] = questions.splice(fromIndex, 1);

  questions.splice(toIndex, 0, movedQuestion);

  renderQuestionnaire();
  saveBuilderState();
}
/* =========================
   HELPERS
========================= */

function normalizeQuestionnaireState() {
  state.questionnaire.blocks = (state.questionnaire.blocks || []).map((block) => ({
    ...block,
    subblocks: (block.subblocks || []).map((subblock) => ({
      ...subblock,
      questions: (subblock.questions || []).map((question) => normalizeQuestion(question))
    }))
  }));
}

function normalizeQuestion(question) {
  const q = {
    id: question?.id || createRuntimeId(),
    questionnaireItemId: question?.questionnaireItemId || question?.id || createRuntimeId(),
    sourceQuestionId: question?.sourceQuestionId || null,
    type: question?.type || 'open',
    title: question?.title || 'Без названия',
    text: question?.text || '',
    comment: question?.comment || '',
    options: Array.isArray(question?.options) ? question.options : [],
    rows: Array.isArray(question?.rows) ? question.rows : [],
    columns: Array.isArray(question?.columns) ? question.columns : [],
    settings: {
      ...(question?.settings || {})
    }
  };

  if (q.type === 'single' || q.type === 'multiple') {
    q.options = Array.isArray(q.options) ? q.options : [];
    q.settings.hasOtherOption = Boolean(q.settings.hasOtherOption);
    q.settings.hasDontKnow = Boolean(q.settings.hasDontKnow);

    if (q.type === 'multiple' && q.settings.maxSelections === undefined) {
      q.settings.maxSelections = '';
    }
  }

  if (q.type === 'ranking') {
    q.options = Array.isArray(q.options) ? q.options : [];
  }

  if (q.type === 'scale') {
    if (q.settings.scaleMin === undefined || q.settings.scaleMin === null || q.settings.scaleMin === '') {
      q.settings.scaleMin = 1;
    }

    if (q.settings.scaleMax === undefined || q.settings.scaleMax === null || q.settings.scaleMax === '') {
      q.settings.scaleMax = 5;
    }

    if (q.settings.leftLabel === undefined) {
      q.settings.leftLabel = '';
    }

    if (q.settings.rightLabel === undefined) {
      q.settings.rightLabel = '';
    }
  }

  if (q.type === 'matrix') {
    q.rows = Array.isArray(q.rows) ? q.rows : [];
    q.columns = Array.isArray(q.columns) ? q.columns : [];
  }

  return q;
}

function getSourceLocationForCurrentEditorQuestion() {
  if (!state.selectedLibraryQuestion) return null;

  const block = state.libraryData.blocks.find(
    (b) => b.id === state.selectedLibraryQuestion.blockId
  );

  const subblock = block?.subblocks?.find(
    (s) => s.id === state.selectedLibraryQuestion.subblockId
  );

  return {
    block: block || null,
    subblock: subblock || null
  };
}

function getDuplicatedQuestionTitle(existingQuestions, baseTitle) {
  const cleanBaseTitle = stripDuplicateSuffix(baseTitle || 'Вопрос');

  const sameTitleCount = existingQuestions.filter((q) => {
    return stripDuplicateSuffix(q.title) === cleanBaseTitle;
  }).length;

  if (sameTitleCount === 0) {
    return cleanBaseTitle;
  }

  return `${cleanBaseTitle} (${sameTitleCount + 1})`;
}

function stripDuplicateSuffix(title) {
  return String(title || '').replace(/\s\(\d+\)$/, '').replace(/\s\(копия\)$/, '');
}

function buildSimpleList(title, list = [], key) {
  const buttonTextMap = {
    rows: '+ Добавить строку',
    columns: '+ Добавить колонку',
    options: '+ Добавить элемент'
  };

  return `
    <div class="subsection-card">
      <h4 class="subsection-title">${escapeHtml(title)}</h4>

      <div class="simple-list">
        ${list.map((item, i) => `
          <div class="simple-list-row">
            <input type="text" data-key="${key}" data-index="${i}" value="${escapeHtml(item)}"/>
            <button
              type="button"
              class="text-action-btn"
              data-action="remove-${key}"
              data-index="${i}"
            >
              Удалить
            </button>
          </div>
        `).join('')}
      </div>

      <button
        type="button"
        class="inline-action-btn"
        data-action="add-${key}"
      >
        ${buttonTextMap[key] || '+ Добавить'}
      </button>
    </div>
  `;
}

function isQuestionnaireBlockSelected(blockId) {
  return state.selectedQuestionnaireQuestion?.blockId === blockId;
}

function isQuestionnaireQuestionSelected(questionnaireItemId) {
  return state.selectedQuestionnaireQuestion?.questionnaireItemId === questionnaireItemId;
}

function isBlockActive(blockId) {
  const selected = state.selectedQuestionnaireQuestion;
  if (!selected) return false;
  return selected.blockId === blockId;
}

function getQuestionGlobalNumber(questionnaireItemId) {
  let counter = 1;

  for (const block of state.questionnaire.blocks || []) {
    for (const subblock of block.subblocks || []) {
      for (const question of subblock.questions || []) {
        if (question.questionnaireItemId === questionnaireItemId) {
          return counter;
        }

        counter++;
      }
    }
  }

  return '';
}

function getLibrarySubblockKey(blockId, subblockId) {
  return `${blockId}::${subblockId}`;
}

function getQuestionnaireSubblockKey(blockId, subblockId) {
  return `${blockId}::${subblockId}`;
}

function getQuestionTypeLabel(type) {
  const labels = {
    single: 'один вариант ответа',
    multiple: 'несколько вариантов ответа',
    open: 'открытый вопрос',
    scale: 'шкала',
    matrix: 'матрица',
    info: 'информационный блок',
    ranking: 'ранжирование'
  };

  return labels[type] || '';
}

function getShortQuestionTypeLabel(type) {
  const labels = {
    single: 'Single',
    multiple: 'Multiple',
    open: 'Open',
    scale: 'Scale',
    matrix: 'Matrix',
    info: 'Info',
    ranking: 'Ranking'
  };

  return labels[type] || type || '';
}

function questionMatchesSearch(question, query) {
  const q = normalizeQuestion(question);

  const searchableText = [
    q.title,
    q.text,
    q.comment,
    ...(q.options || []),
    ...(q.rows || []),
    ...(q.columns || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query);
}

function textIncludes(value, query) {
  return String(value || '').toLowerCase().includes(query);
}
/* =========================
   DOCX EXPORT
========================= */

async function exportQuestionnaireToDocx() {
  const title = (elements.questionnaireTitle?.value || '').trim() || 'Анкета';
  const blocks = state.questionnaire.blocks || [];

  if (!blocks.length) {
    alert('Анкета пока пуста.');
    return;
  }

  if (!window.docx) {
    alert('Не удалось загрузить библиотеку Word. Проверь подключение docx в index.html.');
    return;
  }

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType
  } = window.docx;

  let qCounter = 1;
  const children = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Выгружено из конструктора анкет',
          color: '777777',
          size: 20
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 }
    })
  );

  for (const block of blocks) {
    children.push(
      new Paragraph({
        text: '',
        spacing: { before: 120, after: 40 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: (block.title || '').toUpperCase(),
            bold: true,
            size: 28
          })
        ],
        spacing: { before: 260, after: 180 }
      })
    );

    for (const subblock of block.subblocks || []) {
      for (const question of subblock.questions || []) {
        const q = normalizeQuestion(question);

        children.push(
  new Paragraph({
    children: [
      new TextRun({
        text: `Q${qCounter}. `,
        bold: true
      }),
      ...htmlToDocxTextRuns(q.text || q.title || '', TextRun)
    ],
    spacing: { before: 120, after: 80 }
  })
);

        const answers = buildDocxAnswers(
          q,
          Paragraph,
          TextRun,
          Table,
          TableRow,
          TableCell,
          WidthType
        );

        children.push(...answers);

        const questionTypeLabel = getQuestionTypeLabel(q.type);

        if (questionTypeLabel) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Тип вопроса: ${questionTypeLabel}`,
                  color: '777777'
                })
              ],
              spacing: { before: 60, after: 40 }
            })
          );
        }

        if (q.comment && q.comment.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Комментарий: ${q.comment}`,
                  color: '777777'
                })
              ],
              spacing: { before: 40, after: 120 }
            })
          );
        }

        qCounter += 1;
      }
    }
  }

  const doc = new Document({
    creator: 'Конструктор анкет',
    title,
    description: 'Анкета, экспортированная из конструктора',
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  try {
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${sanitizeFileName(title)}.docx`);
  } catch (error) {
    console.error('Ошибка экспорта DOCX:', error);
    alert('Не удалось выгрузить DOCX. Проверь консоль браузера.');
  }
}

function buildDocxAnswers(question, Paragraph, TextRun, Table, TableRow, TableCell, WidthType) {
  const result = [];
  const q = normalizeQuestion(question);

  if (['single', 'multiple', 'ranking'].includes(q.type)) {
    const options = [...(q.options || [])];

    if (q.settings?.hasOtherOption) {
      options.push('Другое (укажите)');
    }

    if (q.settings?.hasDontKnow) {
      options.push('Затрудняюсь ответить');
    }

    result.push(
      new Paragraph({
        text: '',
        spacing: { after: 20 }
      })
    );

    options.forEach((opt, i) => {
      result.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${i + 1}. ${opt}`
            })
          ],
          spacing: { after: 70 }
        })
      );
    });

    result.push(
      new Paragraph({
        text: '',
        spacing: { after: 40 }
      })
    );

    return result;
  }

  if (q.type === 'open') {
    result.push(
      new Paragraph({
        text: 'Открытый вопрос',
        spacing: { after: 80 }
      })
    );

    return result;
  }

  if (q.type === 'info') {
    return result;
  }

  if (q.type === 'scale') {
    result.push(
      new Paragraph({
        text: `Шкала: ${q.settings?.scaleMin || ''}–${q.settings?.scaleMax || ''}`,
        spacing: { after: 80 }
      })
    );

    return result;
  }

  if (q.type === 'matrix') {
    const rows = q.rows || [];
    const cols = q.columns || [];

    const tableRows = [];

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph('')]
          }),
          ...cols.map((col) =>
            new TableCell({
              width: { size: 65 / Math.max(cols.length, 1), type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: col,
                      bold: true
                    })
                  ]
                })
              ]
            })
          )
        ]
      })
    );

    rows.forEach((row) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: row,
                      bold: true
                    })
                  ]
                })
              ]
            }),
            ...cols.map(() =>
              new TableCell({
                width: { size: 65 / Math.max(cols.length, 1), type: WidthType.PERCENTAGE },
                children: [new Paragraph(' ')]
              })
            )
          ]
        })
      );
    });

    result.push(
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        rows: tableRows
      })
    );

    result.push(
      new Paragraph({
        text: '',
        spacing: { after: 100 }
      })
    );

    return result;
  }

  return result;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function sanitizeFileName(name) {
  return String(name)
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createRuntimeId() {
  return `id_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function htmlToDocxTextRuns(html, TextRun) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html || '';

  const runs = [];

  function walk(node, style = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;

      if (text) {
        runs.push(
          new TextRun({
            text,
            bold: Boolean(style.bold),
            italics: Boolean(style.italics),
            underline: style.underline ? {} : undefined
          })
        );
      }

      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();

    const nextStyle = {
      ...style,
      bold: style.bold || tag === 'b' || tag === 'strong',
      italics: style.italics || tag === 'i' || tag === 'em',
      underline: style.underline || tag === 'u'
    };

    node.childNodes.forEach((child) => walk(child, nextStyle));
  }

  wrapper.childNodes.forEach((child) => walk(child));

  if (!runs.length) {
    runs.push(
      new TextRun({
        text: stripHtml(html)
      })
    );
  }

  return runs;
}

function stripHtml(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html || '';
  return wrapper.textContent || wrapper.innerText || '';
}
function renderHtmlMatrixTable(question, mode = 'structure') {
  const rows = question.rows || [];
  const columns = question.columns || [];

  if (!rows.length || !columns.length) {
    return `
      <div class="matrix-empty">
        Матрица не заполнена
      </div>
    `;
  }

  return `
    <div class="matrix-table-wrap matrix-table-wrap-${mode}">
      <table class="matrix-table">
        <thead>
          <tr>
            <th></th>
            ${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row)}</td>
              ${columns.map(() => `<td></td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}