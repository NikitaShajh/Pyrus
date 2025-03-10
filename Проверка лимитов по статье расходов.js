// Обработчик изменения полей формы: "expense_item", "paymentAmountRub", "converted_amount"
// Функция setVisibility управляет видимостью поля "limit_error"
form.onChange(['expense_item', 'paymentAmountRub', 'converted_amount'], true)
  .setVisibility(['limit_error'], async (state) => {

    // ========================
    // Константы и вспомогательные функции
    // ========================

    // Определяем год, для которого производится проверка
    const REQUIRED_YEAR = 2025;

    // Функция проверки, принадлежит ли переданная дата указанному году
    function isDateInYear(dateStr, year) {
      const date = new Date(dateStr);
      return date.getFullYear() === year;
    }

    // Функция расчёта суммы платежей по задаче, если дата задачи принадлежит к требуемому году.
    // Суммируются два поля: paymentAmountRub и converted_amount.
    function getTaskTotal(task) {
      // Если отсутствуют необходимые поля или их меньше 3-х, возвращаем 0
      if (!task.fields || task.fields.length < 3) return 0;

      // Извлекаем поля: [0] - сумма в рублях, [1] - конвертированная сумма, [2] - дата начала задачи
      const [paymentField, convertedField, startDateField] = task.fields;
      // Если поле даты отсутствует или дата не соответствует требуемому году, возвращаем 0
      if (!startDateField?.date || !isDateInYear(startDateField.date, REQUIRED_YEAR)) return 0;
      
      // Приводим значения к числу, если они присутствуют, иначе 0
      const paymentSum = paymentField?.value != null ? Number(paymentField.value) : 0;
      const convertedSum = convertedField?.value != null ? Number(convertedField.value) : 0;
      return paymentSum + convertedSum;
    }

    // Функция для получения элемента справочника "Статьи расходов" по названию статьи расходов.
    async function fetchCatalogItem(articleName) {
      // Загружаем все элементы справочника "Статьи расходов"
      const catalogItems = await form.getCatalog("Статьи расходов");
      // Ищем элемент, у которого название статьи расходов совпадает с переданным значением
      return catalogItems?.find(
        item => item.columns["Статья расходов в бюджете"] === articleName
      ) || null;
    }


    // ========================
    // Основной блок логики проверки лимитов
    // ========================
    try {
      // Проверка: форма должна находиться на первом шаге создания.
      if (state.currentStep > 0) return false;

      // Извлечение изменений из состояния формы
      const [expenseField, paymentAmountRub, convertedAmount] = state.changes;
      // Если отсутствуют данные по статье расходов, прекращаем выполнение
      if (!expenseField?.columns) return false;

      // Получаем название статьи расходов из поля формы
      const articleName = expenseField.columns["Статья расходов в бюджете"];
      // Получаем данные справочника по данной статье расходов
      const catalogItem = await fetchCatalogItem(articleName);
      if (!catalogItem) return false;

      // Извлекаем бюджет из справочника и приводим его к числу
      const budgetValue = catalogItem.columns["Бюджет"];
      if (!budgetValue) return false;
      const budget = Number(budgetValue);

      // Если оба поля платежа заполнены, пропускаем проверку лимита
      if (paymentAmountRub.value != null && convertedAmount.value != null) return false;
      // Вычисляем текущую сумму платежа (используем значение из заполненного поля)
      const currentPaymentSum = Number(paymentAmountRub.value ?? convertedAmount.value ?? 0);

      // Запрашиваем задачи, связанные с данным элементом формы, с нужными полями
      const contractInfo = await form.fetchSelfRegister(
        f => f.fieldEquals('expense_item', expenseField),
        ['paymentAmountRub', 'converted_amount', 'start_date']
      );

      // Суммируем суммы по всем задачам, удовлетворяющим условиям (только для 2025 года)
      const tasksTotalSum = contractInfo?.tasks?.reduce(
        (total, task) => total + getTaskTotal(task),
        0
      ) || 0;

      // Возвращаем true (показываем ошибку лимита), если суммарная сумма (текущая + по задачам) превышает бюджет
      return (currentPaymentSum + tasksTotalSum) > budget;
    } catch (error) {
      // Обработка ошибок: вывод ошибки в консоль для упрощения отладки
      console.error('Error in limit validation:', error);
      return false;
    }
  });
