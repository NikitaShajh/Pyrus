/*
Проверка, что сумма платежа по разовому счету-договору менее 100000 рублей
*/
form.onChange(["paymentType", "paymentAmountRub"], ).validate("paymentAmountRub", state => {
    const [paymentType, paymentAmountRub] = state.changes;
    const paymentTypeValue = paymentType && paymentType.choice_name;
    const limitsRub = 100000
    if (paymentTypeValue === "Без договора") {
        if (paymentAmountRub && paymentAmountRub.value > limitsRub) {
            return { errorMessage: `Сумма в рублях не должна превышать ${limitsRub} при типе платежа "Без договора".` };
        }
    }
    return null;
});


/*
Проверка, что сумма платежа по разовому счету-договору менее 1000 долларов
*/
form.onChange(["paymentType", "paymentAmountUsd"], ).validate("paymentAmountUsd", state => {
    const [paymentType, paymentAmountUsd] = state.changes;
    const paymentTypeValue = paymentType && paymentType.choice_name;
    const limitsUsd = 1000
    if (paymentTypeValue === "Без договора") {
        if (paymentAmountUsd && paymentAmountUsd.value > limitsUsd) {
            return { errorMessage: `Сумма в долларах не должна превышать ${limitsUsd} при типе платежа "Без договора".` };
        }
    }
    return null;
});


/*
Проверка, что сумма платежа по разовому счету-договору менее 1000 евро
*/
form.onChange(["paymentType", "paymentAmountEur"], ).validate("paymentAmountEur", state => {
    const [paymentType, paymentAmountEur] = state.changes;
    const paymentTypeValue = paymentType && paymentType.choice_name;
    const limitsEur = 1000
    if (paymentTypeValue === "Без договора") {
        if (paymentAmountEur && paymentAmountEur.value > limitsEur) {
            return { errorMessage: `Сумма в евро не должна превышать ${limitsEur} при типе платежа "Без договора".` };
        }
    }
    return null;
}); 


/*
Скрипт, не позволяющй устанавливать срок оплаты на сегодняшниий день
если время заведении 12:00 и позднее
*/
form.onChange(['Срок оплаты'], true)
  .validate('Срок оплаты', state => {
    if (state.currentStep !== 0) {
      return null;
    }

    const [dateValue] = state.changes;
    if (!dateValue) return null;

    const currentDate = new Date();
    const moscowTimeString = currentDate.toLocaleString("en-US", { timeZone: "Europe/Moscow" });
    const moscowDate = new Date(moscowTimeString);
    const currentHours = moscowDate.getHours();
    const currentMinutes = moscowDate.getMinutes();

    const dueDate = new Date(moscowDate);
    dueDate.setHours(0, 0, 0, 0);

    if (currentHours > 12 || (currentHours === 12 && currentMinutes > 0)) {
      dueDate.setDate(dueDate.getDate() + 1); 
    }

    const dateValueObj = new Date(dateValue.value);
    dateValueObj.setHours(0, 0, 0, 0); 

    console.log("Текущее московское время = ", moscowDate);
    console.log("Предельный срок = ", dueDate);
    console.log("Проставленный срок = ", dateValueObj);

    if (dateValueObj < dueDate) {
      return { errorMessage: "При заведении заявки после 12:00 по мск текущего дня срок оплаты может быть не ранее следующего рабочего дня. При горящих оплатах можно согласовать срочную оплату через Илону Кокозову" };
    }

    return null;
  });


/*
Скрипт скрывает поля для добавлене СТО на маршрут согласования от всех пользователей кроме Itsupport
*/
form.onChange([''], true)
    .setVisibility(['Требуется согласование от СТО'], state => {
        console.log("id", state.commenter.person_id);
        return state.currentStep < 1 && state.commenter.person_id == 970711;
    });


/*
Скрипт для заполненя поля "Статья расходов в 1с" в зависмости от значения справочнка
*/
form.onChange(['Статья расходов'])
  .setValue('Статья расходов в 1с', state => {
    const [item] = state.changes;

    if (!item || !item.columns)
      return null;

    return item.columns['Статья расходов в 1С']; // Возвращаем значение из второй колонки
  });


/*
Скрипт для автоматической установки статуса на 3 этапе, при редактировани поля "Номер платежного поручения"
*/
form.onChange(['№ платежного поручения'])
  .setStatus(state => {
    const [currVal] = state.changes;
    const [prevVal] = state.prev;

    // Проверяем, находится ли процесс на третьем этапе
    if (state.currentStep === 3 && !prevVal && currVal) {
      return { choice_name: 'Оплата проведена казначейством' };
    }
  });


/*
* Дата создания: 04.03.2025
* Автор: Атлас АйТи Решения
* Краткое описание: Скрипт валидации согласованности полей "Новая маршрутизация договора" и "u_new_c". 
* Проверяет, чтобы оба поля были в одинаковом состоянии (либо обе галочки стоят, 
* либо обе не стоят), и выдает соответствующие сообщения об ошибке при несоответствии.
*/

form.onChange(['Новая маршрутизация договора', 'u_new_c'], true)
  .validate('u_new_c', state => {
    const [new_routing, new_c] = state.changes;

    if (state.currentStep > 0) {
      return null;
    }
    
    // Проверяем наличие полей
    if (!new_routing || !new_c) 
      return null;
    
    // Сценарий 1: "Новая маршрутизация договора" - галочка стоит, u_new_c - галочка не стоит
    if (new_routing.checked && !new_c.checked) {
      return {
        errorMessage: 'Если хотите приложить договор новой маршрутизации - поставьте эту галочку'
      };
    }
    
    // Сценарий 2: "Новая маршрутизация договора" - галочка не стоит, u_new_c - галочка стоит
    if (!new_routing.checked && new_c.checked) {
      return {
        errorMessage: 'Если хотите приложить договор старой маршрутизации - снимите эту галочку'
      };
    }
    
    // Если оба поля в одинаковом состоянии, ошибок нет
    return null;
  });


/*
* Дата создания: 04.03.2025
* Автор: Атлас АйТи Решения
* Краткое описание: Скрипт валидации согласованности полей "Новая маршрутизация ДС" и "u_new_ds". 
* Проверяет, чтобы оба поля были в одинаковом состоянии (либо обе галочки стоят, 
* либо обе не стоят), и выдает соответствующие сообщения об ошибке при несоответствии.
*/
form.onChange(['Новая маршрутизация ДС', 'u_new_ds'], true)
  .validate('u_new_ds', state => {
    const [new_routing, new_ds] = state.changes;
    
    // Проверяем наличие полей
    if (!new_routing || !new_ds) 
      return null;

    if (state.currentStep > 0) {
      return null;
    }
    
    // Сценарий 1: "Новая маршрутизация договора" - галочка стоит, u_new_c - галочка не стоит
    if (new_routing.checked && !new_ds.checked) {
      return {
        errorMessage: 'Если хотите приложить ДС новой маршрутизации - поставьте эту галочку'
      };
    }
    
    // Сценарий 2: "Новая маршрутизация договора" - галочка не стоит, u_new_c - галочка стоит
    if (!new_routing.checked && new_ds.checked) {
      return {
        errorMessage: 'Если хотите приложить ДС старой маршрутизации - снимите эту галочку'
      };
    }
    
    // Если оба поля в одинаковом состоянии, ошибок нет
    return null;
  });


/*
Скрпт для проверки лиимитов по статья расходов
*/
form.onChange(['expense_item', 'paymentAmountRub', 'converted_amount'], true)
  .setValueAsync('limit_item_checkbox', async (state) => {

    // Год, для которого производится проверка
    const REQUIRED_YEAR = 2025;

    // Функция для получения элемента справочника "Статьи расходов" по названию статьи расходов.
    async function fetchCatalogItem(articleName) {
      const catalogItems = await form.getCatalog("Статьи расходов");
      return catalogItems?.find(
        item => item.columns["Статья расходов в бюджете"] === articleName
      ) || null;
    }

    try {
      // Выполняем проверку только на первом шаге создания
      if (state.currentStep > 0) return;

      const [expenseField, paymentAmountRub, convertedAmount] = state.changes;
      if (!expenseField?.columns) return "unchecked";

      // Получаем название статьи расходов и данные справочника
      const articleName = expenseField.columns["Статья расходов в бюджете"];
      const catalogItem = await fetchCatalogItem(articleName);
      if (!catalogItem) return "unchecked";

      const budgetValue = catalogItem.columns["Бюджет"];
      if (!budgetValue) return "unchecked";
      const budget = Number(budgetValue);

      // Если оба поля заполнены, проверку лимита выполнять не нужно
      if (paymentAmountRub.value != null && convertedAmount.value != null) return "unchecked";
      const currentPaymentSum = Number(paymentAmountRub.value ?? convertedAmount.value ?? 0);

      // Запрашиваем связанные задачи с нужными полями
      const contractInfo = await form.fetchSelfRegister(
        f => f.fieldEquals('expense_item', expenseField),
        ['paymentAmountRub', 'converted_amount', 'start_date']
      );

      // Фильтруем задачи по дате (год = REQUIRED_YEAR) и суммируем их значения
      const tasksTotalSum = (contractInfo?.tasks || [])
        .filter(task => {
          const dateField = task.fields?.find(field => field?.date);
          return dateField && new Date(dateField.date).getFullYear() === REQUIRED_YEAR;
        })
        .reduce((total, task) => {
          const sumRub = Number(task.fields?.[0]?.value || 0);
          const sumConverted = Number(task.fields?.[1]?.value || 0);
          return total + sumRub + sumConverted;
        }, 0);

      // Если общая сумма (текущий платеж + сумма по задачам) превышает бюджет, возвращаем "checked"
      return (currentPaymentSum + tasksTotalSum) > budget ? "checked" : "unchecked";
    } catch (error) {
      console.error('Error in limit validation:', error);
      return "checked";
    }
  });


/*
Скрипт для проверки лимитов по разовому счету-договору для конкретного КА
*/
form.onChange(
  ['contract', 'one_time_contract', 'paymentAmountRub', 'converted_amount'],
  true
).setValueAsync('limit_doc_checkbox', async (state) => {
  // Локальные константы для проверки
  const CONTRACT_YEAR = 2025;
  const CONTRACT_LIMIT = 100000;
  
  try {
    // Блок 1: Проверка базовых условий
    // Обработка выполняется только на первом шаге создания документа
      if (state.currentStep > 0) return;
    
    const [contract, oneTimeCheckbox, paymentAmountRub, convertedAmount] = state.changes;
    
    // Если контракт не выбран, дальнейшая проверка не требуется
    if (!contract) return "unchecked";
    
    // Если оба поля заполнены, пропускаем проверку
    if (paymentAmountRub?.value && convertedAmount?.value) return "unchecked";
    
    // Блок 2: Определение суммы текущего платежа
    const getCurrentSum = (rubField, convertedField) =>
      Number(rubField?.value ?? convertedField?.value ?? 0);
    
    const currentSum = getCurrentSum(paymentAmountRub, convertedAmount);
    if (!currentSum) return "unchecked";
    
    // Если флажок не установлен или отсутствует task_id у контракта, проверка не требуется
    if (!oneTimeCheckbox?.checked || !contract?.task_id) return "unchecked";
    
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
    return finalSum > CONTRACT_LIMIT ? "checked" : "unchecked";
  } catch (error) {
    console.error('Error in contract limit validation:', error);
    return "unchecked";
  }
});


/*
Скрипт для валидации заполненности только одного из полей
*/
form.onChange(['contract', 'paymentAmountRub', 'converted_amount'])
  .validateAsync('contract', async state => {
    const [contract, paymentAmountRub, converted_amount] = state.changes;
      const sum1 = paymentAmountRub.value;
      const sum2 = converted_amount.value;
      if (sum1 && sum2) {
        return { errorMessage: 'Должно быть заполнено только одно из полей: Сумма платежа (рубли) или Сумма на пересчет в рублях.' };
      }
});


/*
Скрипт для автоматческой установки статуса, при превышени лимитов
*/
form.onChange(['limit_item_checkbox', 'limit_doc_checkbox'], true)
  .setStatus(state => {
    const [limit_item_checkbox, limit_doc_checkbox] = state.changes;

    // Явно проверяем свойство "checked" на true
    const itemChecked = limit_item_checkbox?.checked === true;
    const docChecked  = limit_doc_checkbox?.checked === true;

    if ((itemChecked || docChecked) && state.currentStep < 3) {
      return { choice_name: 'Превышение лимитов' };
    }
    return {};
  });


/*
Скрипт для расчета курса валют для разных валют 
*/
form.onChange(['amount_rub', 'paymentAmountUsd', 'paymentAmountEur'])
  .setValueAsync('exchange', async state => {
    const [amount_rub, paymentAmountUsd, paymentAmountEur] = state.changes;

    // Получаем значения через свойство value
    const rubValue = Number(amount_rub.value);

    // Получаем значения для валют
    const usdValue = paymentAmountUsd.value;
    const eurValue = paymentAmountEur.value;
    const amount_rubValue = amount_rub.value;



    // Проверяем, заполнены ли поля (и не равны 0)
    const usdFilled = usdValue && Number(usdValue) !== 0;
    const eurFilled = eurValue && Number(eurValue) !== 0;

    // Если ни одно поле валюты не заполнено, выходим без дальнейших вычислений
    if (!amount_rubValue) {
      return null;
    }

    let exchange = null;
    if (usdFilled && eurFilled) {
      exchange = null;
    } else if (usdFilled) {
      exchange = rubValue / Number(usdValue);
    } else if (eurFilled) {
      exchange = rubValue / Number(eurValue);
    }
    
    return exchange;
});

/*
Скрипт для заполнения и блокировки галочки
*/
form.onChange([''],)
  .setValue('Новый маршрут 19.12.2024', state => {
    const [checkbox] = state.prev;
    
    if (!checkbox)
      return null;
    return "checked"
  });
