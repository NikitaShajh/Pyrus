
form.onChange(
  ['contract', 'one_time_contract', 'paymentAmountRub', 'converted_amount'],
  true
).setVisibility(['doc_error'], async state => {
  // Локальные константы для проверки
  const CONTRACT_YEAR = 2025;
  const CONTRACT_LIMIT = 100;
  
  try {
    // Блок 1: Проверка базовых условий
    // Обработка выполняется только на первом шаге создания документа
    if (state.currentStep > 0) return false;
    
    const [contract, oneTimeCheckbox, paymentAmountRub, convertedAmount] = state.changes;
    
    // Если контракт не выбран, дальнейшая проверка не требуется
    if (!contract) return false;
    
    // Если оба поля заполнены, пропускаем проверку
    if (paymentAmountRub?.value && convertedAmount?.value) return false;
    
    // Блок 2: Определение суммы текущего платежа
    const getCurrentSum = (rubField, convertedField) =>
      Number(rubField?.value ?? convertedField?.value ?? 0);
    
    const currentSum = getCurrentSum(paymentAmountRub, convertedAmount);
    if (!currentSum) return false;
    
    // Если флажок не установлен или отсутствует task_id у контракта, проверка не требуется
    if (!oneTimeCheckbox?.checked || !contract?.task_id) return false;
    
    // Блок 3: Получение и обработка данных реестра
    // Запрашиваем записи реестра для выбранного контракта с установленной галочкой
    const contractInfo = await form.fetchSelfRegister(
      f => f.fieldEquals('contract', contract)
            .fieldEquals('one_time_contract', "checked"),
      ['paymentAmountRub', 'converted_amount', 'start_date']
    );
    
    // Функция суммирования значений задач за указанный год
    const sumTasksForYear = (tasks, year) =>
      tasks
        .filter(task => {
          const dateField = task.fields?.find(field => field?.date);
          return dateField && new Date(dateField.date).getFullYear() === year;
        })
        .reduce((total, task) => {
          const sumRub = Number(task.fields?.[0]?.value || 0);
          const sumConverted = Number(task.fields?.[1]?.value || 0);
          return total + sumRub + sumConverted;
        }, 0);
    
    const totalSumTasks = sumTasksForYear(contractInfo?.tasks || [], CONTRACT_YEAR);
    
    // Блок 4: Итоговая проверка лимита по контракту
    const finalSum = currentSum + totalSumTasks;
    return finalSum > CONTRACT_LIMIT;
  } catch (error) {
    // Обработка ошибок: при возникновении ошибки скрываем поле doc_error
    return false;
  }
});
