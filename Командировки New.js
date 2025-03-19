/*
Скрипт для проверки, что дата окончания не ранее даты начала
*/
form.onChange(['Начало', 'Окончание'])
    .validate('Окончание', state => {
        const [start, end] = state.changes;
        
        if (!start || !end)
          return null;

        if (start.date && end.date && start.date >= end.date)
            return {
              errorMessage: 'Не может быть раньше даты начала'
            };

        return null;
    });


/*
Скрипт для подсчета кол-во дней между датой начала и датой окончания
*/
form.onChange(['Начало','Окончание'])
  .setValues(['Количество дней'], state => {
    const [startDateField, endDateField] = state.changes;
    
    if (!startDateField || !endDateField)
      return null;

    const startDate = new Date (startDateField.date);
    const endDate = new Date (endDateField.date);
    const oneDate = 1000*3600*24;
    const diffTime = endDate - startDate;
    const numberOfDate = (diffTime / oneDate) + 1;
    
    return [numberOfDate.toString()];
 });
