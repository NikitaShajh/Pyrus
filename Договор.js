/**
 * Ниже представлен шаблон простого скрипта.
 * Вместо `watchingFieldName` и `calculatedFieldName` подставьте названия соответствующих полей этой формы.
 * Справка: https://pyrus.com/ru/help/scripts/quick-start
 */
form.onChange(['Номер договора, присвоенный КА, соответствует нашему', 'Номер договора Flowwow']).setValues(['u_contract_counterparty'], 
    state => {
        const [check, contract_number] = state.changes;

        if (check.checked)
            {
            return [contract_number.value]
            }
        else 
            {
            return [null]
            }    
    });


form.onChange(['Form Task Sequence'], true).setValues(['u_contract_num'], 
    state => {
        const [num] = state.changes;

        console.log(num)

        if (num.value) {
          return [num.value]
        }
        else return [""]
    });  

form.onChange(['Начало действия Договора'], true).setValues(['Договор-день','Договор-месяц','Договор-год'], 
    state => {
        const [creationDate] = state.changes;

        console.log(creationDate)

        if (creationDate && creationDate.date) {

            const MONTHS = ['не будет такого','января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        
            return [creationDate.date.substring(8,10),MONTHS[Number(creationDate.date.substring(5,7))],creationDate.date.substring(0,4)];
        }
        else return ["","",""]
    });

form.onChange(['Начало действия NDA'], true).setValues(['NDA-день','NDA-месяц','NDA-год'], 
    state => {
        const [creationDate] = state.changes;

        console.log(creationDate)

        if (creationDate && creationDate.date) {

            const MONTHS = ['не будет такого','января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        
            return [creationDate.date.substring(8,10),MONTHS[Number(creationDate.date.substring(5,7))],creationDate.date.substring(0,4)];
        }
        else return ["","",""]
    });

/*
form.onChange(['Руководитель (Контрагент)', 'u_main_yesno']).setValues(['u_counterpartymain_name_FIO_IP_'], 
    state => {
        const [headc, main_yesno] = state.changes;

        if (!main_yesno || !main_yesno.columns)
            return null; 
        else
        {
            if (headc && headc.value && main_yesno.columns['Да/нет'] == 'Да') {
                return [headc.value]
            }
            else return [""]
        }
    });  
*/

form.onChange(['ФИО подписанта в род. падеже', 'Должность подписанта в род. падеже', 'Основание для подписания в род. падеже'], true).setValues(['База для КА'], 
    state => {
        const [fio_rp, jobtitle, base] = state.changes; 

        console.log(fio_rp)

        if (fio_rp.value && jobtitle.value && base.value) {
          return ['в лице ' + jobtitle.value + ' ' + fio_rp.value + ', действующего на основании ' + base.value]
        }
        else return [""]
    });   

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

form.onChange(['u_ds2', 'u_df2']).validate('u_df2',
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

form.onChange(['u_ds3', 'u_df3']).validate('u_df3',
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


form.onChange(['u_ds1', 'u_ds2', 'u_ds3'], true).setValues(['u_contract_start_date'], 
    state => {
        const [ds1, ds2,ds3] = state.changes;
        if (ds1.date) {
        console.log('Дата начала действия')    
        let date = new Date(ds1.date)
        return [{date: date.toDateString()}]        
        }
        if (ds2.date) {
        let date = new Date(ds2.date)
        return [{date: date.toDateString()}] 
        }
        if (ds3.date) {
        let date = new Date(ds3.date)
        return [{date: date.toDateString()}] 
        }
        else return[null]        

    }); 

form.onChange([''],)
  .setValue('Новая маршрутизация договора', state => {
    const [checkbox] = state.prev;
    
    if (!checkbox)
      return null;
    return "checked"
  });



/*
Скрипт для обязательного заполнения поля только при создании формы
(что бы не затрагивать существующие) 
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
