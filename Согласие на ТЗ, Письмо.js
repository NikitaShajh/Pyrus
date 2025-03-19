/*
Скрипт проверки, что дата окончания не ранее даты начала
*/
form.onChange(['u_ds1', 'u_df1']).validate('u_df1',
   state => {
        const [proxy_date_start, proxy_date_end] = state.changes;
        
        const date_start = new Date(proxy_date_start.date);
        const date_end = new Date(proxy_date_end.date);
        console.log(date_start, date_end)
        if (proxy_date_start.date && proxy_date_end.date && proxy_date_start.date > proxy_date_end.date)
        {
        return {
                errorMessage: 'Не может быть раньше даты начала'
            };        
        }
    }
)

/*
Скрпт для установки неизменяемой галки
*/
form.onChange([''],)
  .setValue('Новая маршрутизация', state => {
    const [checkbox] = state.prev;
    
    if (!checkbox)
      return null;
    return "checked"
  });
