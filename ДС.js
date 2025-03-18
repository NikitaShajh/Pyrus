

// /*Справочник Определение стоимости на момент заключения ДС*/
// let catalogbanks = null;
// form.getCatalog(245225).then(items => {
//     catalogbanks = items;
// });

// /*Фильтруем способ оплаты в зависимости от определния стоиомсти*/
// form.onChange(['u_define_price_add_contract'], true)
//   .setFilter('u_payway_contract', state => {
//     const [define_price] = state.changes;
//     console.log(catalogbanks) 
//     if (!catalogbanks || !define_price || !define_price.columns)
//       return null;

//     const companyCol = define_price.columns["Определение стоимости на момент заключения ДС"];
//     const othercompany = "На момент заключения ДС стоимость определена/не определена"
//     console.log(companyCol)
//     if (define_price.columns["Определение стоимости на момент заключения ДС"]=='На момент заключения ДС стоимость определена')
//       {
//         const filtered = catalogbanks
//           .filter(item => item.columns["Определение стоимости на момент заключения ДС"] == companyCol)
//           .map(item => item.columns["Способ оплаты"]);
//       console.log(filtered)
//       return filtered.length > 0
//           ? {
//               values: filtered
//           }
//           : null
//         }
//     else if (define_price.columns["Определение стоимости на момент заключения ДС"]=='На момент заключения ДС стоимость не определена' || define_price.columns["Определение стоимости на момент заключения ДС"] == othercompany)
//       {
//         const filtered = catalogbanks
//           .filter(item => item.columns["Определение стоимости на момент заключения ДС"] == companyCol)
//           .map(item => item.columns["Способ оплаты"]);
//       console.log(filtered)
//       return filtered.length > 0
//           ? {
//               values: filtered
//           }
//           : null
//         }       
// });

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

form.onChange([''],)
  .setValue('Новая маршрутизация ДС', state => {
    const [checkbox] = state.prev;
    
    if (!checkbox)
      return null;
    return "checked"
  });


/*
* Дата создания: 15.01.2025
* Автор: Роман
* Краткое описание: Скрипт проверяет обязательность заполнения поля даты u_df1 
* в зависимости от значения галочки u_indefinitely. Если галочка не установлена, 
* поле даты становится обязательным для заполнения.
*/

form.onChange(['u_df1', 'u_indefinitely'], true)
  .validate('u_df1', state => {
    const [date, indefinitely] = state.changes;
    
    // Если установлена галочка "Бессрочно", валидация не требуется
    if (indefinitely && indefinitely.checked) {
      return null;
    }
    
    // Если галочка не установлена и дата не заполнена
    if (!date || !date.date) {
      return {
        errorMessage: 'Заполните поле'
      };
    }
    
    return null;
  });



form.onChange(['ИНН (Контрагент)'], true)
  .setValue('ИНН (служебное)', state => {
    const [inn] = state.changes;
    
    if (!inn || !inn.text)
      return null;
      
    return inn.text;
  });



/*
* Дата создания: 28.01.2025
* Автор: Атлас АйТи Решения
* Краткое описание: Скрипт фильтрует поле "Договор" по значению ИНН из служебного поля,
* только если установлена галочка "Фильтр по договору".
*/

form.onChange(['ИНН (служебное)', 'Фильтр по договору'], true)
  .setFilter('Договор', state => {
    const [company, checkbox] = state.changes;
    
    if (!checkbox?.checked || !company?.text) {
      return null;
    }
    
    return {
      filters: [
        {
          fieldName: "ИНН Контрагента",
          value: company.text
        }
      ]
    };
  });

/*
form.onChange(['ИНН (служебное)'], true)
  .setFilter('ДС', state => {
    const [company] = state.changes;
    if (!company || !company.text) {
      return null;
    }

    return {
      filters: [
        {
          fieldName: "ИНН (служебное)",
          value: company.text
        }
      ]
    };
  });
*/



/*
Скрипт для обязательного заполнения поля только при создании формы
*/

form.onChange(['У страницы, где размещается наша реклама, более 10 000 подписчиков?'], true)
  .validate('У страницы, где размещается наша реклама, более 10 000 подписчиков?', state => {
    const [script] = state.changes;

    const script1 = !script || !script.choice_id;

    // Валидация на этапе 0
    if (state.currentStep === 0) {
      if (script1)
        return {
          errorMessage: 'Должно быть заполнено'
        };
    }

    return null;
  });
