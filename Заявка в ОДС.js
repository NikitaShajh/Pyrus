// form.onChange(["Наименование (Контрагент)"], true)
//     .setFilter("u_contract_close_docs", state => {
//         const [counterparty] = state.changes;
//         console.log('фильтруем по контрагенту договоры', counterparty.value)
//         if (!counterparty || !counterparty.value) return null;

//         return {
//             filters: [{
//                 fieldName: "Наименование (Контрагент)",
//                 value: counterparty.value
//             }]
//         }
//     });


/*
* Дата создания: 03.10.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет, чтобы в договоре поставки было заполнено только
* одно из двух полей - либо загружен файл договора, либо указана ссылка на него.
* Предотвращает одновременное заполнение обоих полей.
*/

form.onChange(['u_file_delivery', 'u_link_delivery'], true)
 .validate('u_link_delivery', state => {
   const [fileField, linkField] = state.changes;
   
   // Проверяем заполненность полей
   const hasFile = fileField?.value;
   const hasLink = linkField?.text;
   
   // Если заполнены оба поля, выводим ошибку
   if (hasFile && hasLink) {
     return {
       errorMessage: 'Заполните только Файл или же Ссылку на файл'
     };
   }
   
   return null;
 });

/*
* Дата создания: 03.10.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет, чтобы в договоре поставки было заполнено только 
* одно из двух полей - либо загружен файл договора, либо указана ссылка на него.
* Предотвращает одновременное заполнение обоих полей.
*/

form.onChange(['u_file_delivery', 'u_link_delivery'], true)
 .validate('u_file_delivery', state => {
   const [fileField, linkField] = state.changes;
   
   // Проверяем наличие файла и ссылки
   const hasFile = fileField?.files?.length > 0;
   const hasLink = linkField?.text?.length > 0;
   
   // Если заполнены оба поля, выводим ошибку
   if (hasFile && hasLink) {
     return {
       errorMessage: 'Заполните только Файл или же Ссылку на файл'
     };
   }
   
   return null;
 });


/*
* Дата создания: 08.10.2024
* Автор: Роман
* Краткое описание: Скрипт определяет необходимость заполнения дополнительных данных 
* на основе комбинации значений полей формы: тип действия, вид договора, наличие доп. соглашения,
* форма документа и условия оказания услуг. Результат записывается в поле "Нужно заполнить данные".
*/

form.onChange(['Что сделать', 'Вид договора', 'В рамках договора оформляется также ДС', 'Форма документа', 'Условия оказания услуг'], true)
 .setValue('Нужно заполнить данные', state => {
   const [actionType, contractType, hasAddendum, documentForm, serviceTerms] = state.changes;

   // Проверка условий для заполнения дополнительных данных
   const isAddendumOrAppendix = actionType?.columns["Что сделать"] === "Доп. соглашение / Приложение";
   
   const isContractWithCustomerForm = actionType?.columns["Что сделать"] === "Договор" &&
                                    documentForm?.columns["Форма документа"] === "Форма КА" &&
                                    serviceTerms?.columns["Условия оказания услуг"] === "Условия оказания услуг определены в Договоре";
   
   const hasAdditionalAgreement = hasAddendum?.columns["Да/нет"] === "Да";
   
   const isSpecialContractType = contractType?.columns["Вид договора"] &&
                                ["Соглашение об ЭДО", "Договор аренды"].includes(contractType.columns["Вид договора"]) &&
                                serviceTerms?.columns["Условия оказания услуг"] === "Условия оказания услуг определены в Договоре";
   
   const isSmallOffer = contractType?.columns["Вид договора"] === "Договор-оферта/Счет до 100 000 рублей";

   // Если выполняется хотя бы одно из условий, требуется заполнение дополнительных данных
   const needAdditionalData = isAddendumOrAppendix ||
                             isContractWithCustomerForm ||
                             hasAdditionalAgreement ||
                             isSpecialContractType ||
                             isSmallOffer;

   return {
     item_name: needAdditionalData ? "Да" : "Нет"
   };
 });

/*Справочник Определение стоимости на момент заключения ДС*/
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
//           .filter(item => item.columns["Для фильтра"] == companyCol || item.columns["Для фильтра"] == othercompany)
//           .map(item => item.columns["Способ оплаты"]);
//       console.log(filtered)
//       return filtered.length > 0
//           ? {
//               values: filtered
//           }
//           : null
//         }
//     else if (define_price.columns["Определение стоимости на момент заключения ДС"]=='На момент заключения ДС стоимость не определена')
//       {
//         const filtered = catalogbanks
//           .filter(item => item.columns["Для фильтра"] == othercompany)
//           .map(item => item.columns["Способ оплаты"]);
//       console.log('На момент заключения ДС стоимость не определена', filtered)
//       return filtered.length > 0
//           ? {
//               values: filtered
//           }
//           : null
//         }       
// });

/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет обязательность выбора карточки контрагента (КА) 
* в двух случаях: когда коммуникацию ведет инициатор или когда создается 
* дополнительное соглашение/приложение.
*/

form.onChange(['u_communication ', 'u_counterpartycard', 'Что сделать'], true)
  .validate('u_counterpartycard', state => {
    const [communication, counterpartycard, act] = state.changes;
    console.log('валидация на КА',communication, counterpartycard)
    if (!communication  || !communication.columns)
      return null;

    if ((counterpartycard.task_id == null && communication.columns['Кто будет вести коммуникацию с КА'] == 'Инициатор') || (counterpartycard.task_id == null && act.columns['Что сделать'] == 'Доп. соглашение / Приложение'))
      return {
        errorMessage: 'Обязательно выберите карточку КА'
      };

    return null;
  });

/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет наличие хотя бы одного заполненного контактного 
* способа связи: номер телефона, email или ник в Telegram. Если все поля пустые,
* выдает сообщение об ошибке.
*/

form.onChange(['u_phone_number', 'u_email', 'u_nick_TG'], true)
 .validate('u_email', state => {
   const [phone, email, telegramNick] = state.changes;
   
   // Проверяем заполненность каждого поля
   const hasPhone = phone?.text?.length > 0;
   const hasEmail = email?.text?.length > 0; 
   const hasTelegram = telegramNick?.text?.length > 0;

   // Если все поля пустые - выводим ошибку
   if (!hasPhone && !hasEmail && !hasTelegram) {
     return {
       errorMessage: 'Заполните номер телефона или адрес эл. почты, или ник в Telegram'
     };
   }

   return null;
 });


/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет корректность указанного периода - дата окончания 
* не может быть раньше даты начала. При нарушении этого условия выводится сообщение 
* об ошибке.
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

form.onChange(['u_ds4', 'u_df4']).validate('u_df4',
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

form.onChange(['u_ds5', 'u_df5']).validate('u_df5',
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

form.onChange(['u_ds6', 'u_df6']).validate('u_df6',
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

form.onChange(['u_ds7', 'u_df7']).validate('u_df7',
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

form.onChange(['u_ds8', 'u_df8']).validate('u_df8',
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

form.onChange(['u_ds9', 'u_df9']).validate('u_df9',
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

form.onChange(['u_ds10', 'u_df10']).validate('u_df10',
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

form.onChange(['u_ds11', 'u_df11']).validate('u_df11',
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

form.onChange(['u_ds12', 'u_df12']).validate('u_df12',
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

form.onChange(['u_ds13', 'u_df13']).validate('u_df13',
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

form.onChange(['u_ds14', 'u_df14']).validate('u_df14',
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
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет корректность формата номера телефона - 
* он должен начинаться со знака '+'. Если номер указан в неправильном формате,
* выводится сообщение об ошибке.
*/

form.onChange(['u_phone_number'])
 .validate('u_phone_number', state => {
   const [phone] = state.changes;
   
   // Если поле пустое - пропускаем валидацию
   if (!phone?.text?.trim()) {
     return null;
   }

   // Проверяем, что номер начинается с +
   if (!phone.text.startsWith('+')) {
     return {
       errorMessage: 'Номер телефона должен начинаться на +'
     };
   }

   return null;
 });

form.onChange(['u_phone_number2'])
 .validate('u_phone_number2', state => {
   const [phone] = state.changes;
   
   // Если поле пустое - пропускаем валидацию
   if (!phone?.text?.trim()) {
     return null;
   }

   // Проверяем, что номер начинается с +
   if (!phone.text.startsWith('+')) {
     return {
       errorMessage: 'Номер телефона должен начинаться на +'
     };
   }

   return null;
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
