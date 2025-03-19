//Козловская В. закомментировала эти скрипты 15.10

// form.onChange(['ИНН (Наименование контрагента)'])
//   .validateAsync('ИНН (Наименование контрагента)', async state => {
//     const [inn] = state.changes;

//     if (!inn)
//       return null;

//     if (inn.text) {
//       const duplicates = await form.fetchSelfRegister(f => f
    
//         .fieldEquals('ИНН (Наименование контрагента)', inn), []
//       );

//       if (!duplicates || !duplicates.tasks)
//         return null;

//       const firstDuplicate = duplicates.tasks[0];
//       if (firstDuplicate)
//         return {
//           errorMessage: `Контрагент заведен в Pyrus ранее, воспользуйтесь <a href="#id${firstDuplicate.task_id}"> имеющейся карточкой </a>`
//         };
//     }

//         return null;
//     });

// let catalogItems = null;

// form.getCatalog(232562).then(items => {
//     catalogItems = items;
//     // Выводим содержимое справочника в консоль
//     console.log('Содержимое справочника:', catalogItems);
// }).catch(error => {
//     console.error('Ошибка загрузки справочника:', error);
// });

// form.onChange(['Наименование контрагента'], true)
//   .validate('Наименование контрагента', state => {
//     const [naimenovanieKontragenta] = state.changes;
//     const naimenovanieKontragentaValue = naimenovanieKontragenta.value || '';
//     console.log(typeof naimenovanieKontragentaValue);
//     // Выводим значение naimenovanieKontragentaValue в консоль
//     console.log('Значение Наименование контрагента:', naimenovanieKontragentaValue);
    
//     if (catalogItems) {
//         const isInBlacklist = catalogItems.some(item => item.columns['Юридическое название'] === naimenovanieKontragentaValue);
//         // Выводим результат поиска в консоль
//         console.log('Найден ли в ЧС:', isInBlacklist);
//         if (isInBlacklist) {
//             return {
//                 errorMessage: 'Контрагент в ЧС'
//             };
//         }
//     } else {
//         console.log('catalogItems ещё не загружен.');
//         // Если catalogItems ещё не загружен, можем вернуть ошибку или оставить как есть
//         // return { errorMessage: 'Справочник ещё загружается' };
//     }
//     return null;
// });



/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт управляет видимостью полей формы в зависимости от 
* организационно-правовой формы контрагента. Показывает дополнительные поля только для
* юридических лиц (ЮЛ).
*/

form.onChange(['Тип контрагента'], true)
  .setVisibility(
    [
      'КПП (Контрагент)', 
      'Руководитель (Контрагент)', 
      'Должность (Контрагент)'
    ], 
    state => {
      const [counterparty_type] = state.changes;

      // Проверяем наличие данных из справочника
      if (!counterparty_type?.columns) {
        return null;
      }

      // Получаем тип из колонки справочника
      const type = counterparty_type.columns['Орг.-правовая форма'];
      
      // Показываем поля только для ЮЛ
      return type === 'ЮЛ';
    }
  );



/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт разбирает адрес, введенный одной строкой, и заполняет 
* отдельные поля формы (индекс, регион, район, населенный пункт). Обрабатывает особые 
* случаи для Москвы и Санкт-Петербурга. Работает только для нужных типов контрагентов.
*/

form.onChange(['Адрес (Контрагент)', 'u_type_counterparty'])
  .setValues(
    [
      'Почтовый индекс',
      'Регион (край, область, респ.)',
      'Район',
      'Населенный пункт'
    ],
    state => {
      const [address, counterparty_type] = state.changes;

      // Проверяем наличие данных о типе контрагента
      if (!counterparty_type?.columns) {
        return null;
      }

      const orgType = counterparty_type.columns['Орг.-правовая форма'];
      
      // Для определенных типов организаций очищаем поля
      if (['ЮЛ', 'ФЛ', 'СМЗ'].includes(orgType)) {
        return [null, null, null, null];
      }

      // Разбиваем адрес на составляющие
      const addressParts = address.value.split(',');

      // Особая обработка для Москвы и Санкт-Петербурга
      if ([' г. Москва', ' г. Санкт-Петербург'].includes(addressParts[1])) {
        addressParts[2] = addressParts[1];
      }

      // Если первая часть - почтовый индекс (6 цифр)
      if (addressParts[0].length === 6) {
        return [
          addressParts[0],          // индекс
          addressParts[1],          // регион
          null,                     // район
          addressParts[2]           // населенный пункт
        ];
      }

      // Если индекс отсутствует
      return [
        null,                       // индекс
        addressParts[0],            // регион
        null,                       // район
        addressParts[1]             // населенный пункт
      ];
    }
  );

/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт копирует адрес регистрации в почтовый адрес для резидентов РФ 
* при установке галочки "Совпадает с адресом регистрации". При отключении галочки или 
* для нерезидентов поле очищается.
*/

form.onChange(['u_country', 'u_adress_counterparty', 'u_matches_reg_adress'], true)
  .setValues(['u_match_mail_address'], state => {
    const [country, address, isMatching] = state.changes;

    // Копируем адрес только если:
    // 1. Установлена галочка совпадения адресов
    // 2. Есть непустой адрес
    // 3. Страна регистрации - РФ
    if (isMatching.checked && 
        address?.value && 
        country?.columns['Страна регистрации КА'] === 'РФ') {
      return [address.value];
    }

    // В остальных случаях очищаем поле
    return [''];
  });

/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт копирует юридический адрес в почтовый адрес для нерезидентов РФ 
* при установке галочки "Совпадает с адресом регистрации". При отключении галочки или 
* для резидентов РФ поле очищается.
*/

form.onChange(['u_country', 'Юридический адрес', 'u_matches_reg_adress'], true)
  .setValues(['u_match2_mail_address_foreign'], state => {
    const [country, address, isMatching] = state.changes;

    // Копируем адрес только если:
    // 1. Установлена галочка совпадения адресов
    // 2. Есть непустой адрес
    // 3. Страна регистрации - не РФ
    if (isMatching.checked && 
        address?.value && 
        country?.columns['Страна регистрации КА'] === 'Не РФ') {
      return [address.value];
    }

    // В остальных случаях очищаем поле
    return [''];
  });


/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт формирует адрес контрагента из различных полей формы.
* Для ЮЛ копирует значение из поля "Адрес (Контрагент)", для других типов организаций
* собирает адрес из отдельных компонентов (индекс, регион, район, город, улица и т.д.)
* Обновлено: 27.09.2024 - Изменена логика копирования адреса (Варвара)
*/

form.onChange([
  'u_type_counterparty',
  'Адрес (Контрагент)',
  'u_mailadress_s',
  'u_mailadress',
  'u_region_s',
  'u_region',
  'u_area_s',
  'u_area',
  'u_locality_s',
  'u_locality',
  'Тип улицы',
  'Название улицы',
  'Дом',
  'Корпус',
  'Вид строения',
  'Номер (буква) строения',
  'Квартира'
]).setValues(['u_adress_counterparty'], state => {
  const [
    type_counterparty,
    address,
    index,
    index_fl,
    region,
    region_fl,
    area,
    area_fl,
    city,
    city_fl,
    street_type,
    street,
    house,
    body,
    building_type,
    building_number,
    apartment
  ] = state.changes;

  // Проверяем наличие типа контрагента
  if (!type_counterparty?.columns) {
    return [null];
  }

  // Для юридических лиц просто копируем адрес
  if (type_counterparty.columns['Орг.-правовая форма'] === 'ЮЛ') {
    return [address?.value || null];
  }

  // Для остальных типов организаций собираем адрес из компонентов
  if (!region?.value && !region_fl?.value) {
    return [null];
  }

  // Формируем адресную строку
  let addressParts = [];

  // Добавляем индекс
  if (index?.text) addressParts.push(index.text);
  if (index_fl?.text) addressParts.push(index_fl.text);

  // Добавляем регион
  if (region?.text) addressParts.push(region.text);
  if (region_fl?.text) addressParts.push(region_fl.text);

  // Добавляем район
  if (area?.text) addressParts.push(area.text);
  if (area_fl?.text) addressParts.push(area_fl.text);

  // Добавляем город
  if (city?.text) addressParts.push(city.text);
  if (city_fl?.text) addressParts.push(city_fl.text);

  // Добавляем улицу
  if (street_type?.columns) {
    addressParts.push(street_type.columns['сокр. тип'] + ' ' + (street?.text || ''));
  } else if (street?.text) {
    addressParts.push(street.text);
  }

  // Добавляем дом
  if (house?.value) addressParts.push('д. ' + house.value);

  // Добавляем корпус
  if (body?.text) addressParts.push('к. ' + body.text);

  // Добавляем строение
  if (building_type?.choice_id) {
    let buildingInfo = building_type.choice_name;
    if (building_number?.text) {
      buildingInfo += ' ' + building_number.text;
    }
    addressParts.push(buildingInfo);
  }

  // Добавляем квартиру
  if (apartment?.text) addressParts.push('кв. ' + apartment.text);

  // Собираем все части адреса в одну строку
  return [addressParts.filter(Boolean).join(', ')];
});


/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт копирует значение ИНН контрагента из основного поля 
* в служебное поле формы для дальнейшего использования.
*/

form.onChange(['ИНН (Контрагент)', 'ИНН ФЛ'], true)
  .setValues(['u_INN_counterparty'], state => {
    const [innUL, innFL] = state.changes;
    
    // Возвращаем значение ИНН из заполненного поля
    return [innUL?.value || innFL?.value || null];
  });




/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт копирует значение ОГРН/ОГРНИП контрагента в служебные поля.
* В зависимости от типа контрагента (ЮЛ/ИП) добавляет соответствующий префикс.
*/

form.onChange(['ОГРН (Контрагент)', 'u_type_counterparty'], true)
  .setValues(['u_OGRN_counterparty', 'u_OGRN_template_counterparty'], state => {
    const [ogrnValue, type_counterparty] = state.changes;

    // Проверяем наличие типа контрагента
    if (!type_counterparty?.columns) {
      return [null, null];
    }

    const orgType = type_counterparty.columns['Орг.-правовая форма'];

    // Определяем префикс в зависимости от типа организации
    let prefix;
    switch(orgType) {
      case 'ЮЛ':
        prefix = 'ОГРН ';
        break;
      case 'ИП':
        prefix = 'ОГРНИП ';
        break;
      default:
        return [null, null];
    }

    // Возвращаем значения для обоих полей
    return [
      ogrnValue.text,
      prefix + ogrnValue.value
    ];
  });




/*
* Дата создания: 23.04.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет заполнение хотя бы одного контактного поля из трех
* возможных: номер телефона, электронная почта или ник в Telegram. Если ни одно поле
* не заполнено, выводится сообщение об ошибке.
*/

form.onChange(['u_phone_number', 'u_email', 'u_nick_TG'], true)
  .validateAsync('u_email', async state => {
    // Получаем значения всех трёх полей
    const [phone, email, nick_TG] = state.changes;
    
    // Проверяем каждое поле на пустоту
    const phoneIsEmpty = !phone || !phone.text;
    const emailIsEmpty = !email || !email.text;
    const nick_TGIsEmpty = !nick_TG || !nick_TG.text;
    
    // Если все поля пустые - возвращаем ошибку
    if (phoneIsEmpty && emailIsEmpty && nick_TGIsEmpty)
      return {
        errorMessage: 'Заполните номер телефона или адрес эл. почты, или ник в Telegram'
      };
      
    // Если хотя бы одно поле заполнено - возвращаем null (ошибки нет)
    return null;
  });


/*
* Дата создания: 23.04.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет корректность введенного номера телефона.
* Валидация проверяет наличие символа '+' в начале номера. При отсутствии
* данного символа выводится сообщение об ошибке.
*/

form.onChange(['u_phone_number'])
  .validateAsync('u_phone_number', async state => {
    // Получаем значение поля телефона
    const [phone] = state.changes;
    
    // Выводим в консоль первый и второй символы для отладки
    console.log('первый и второй элемент телефона', phone.text[0], phone.text[1]);
    
    // Проверяем что поле не пустое
    if (phone.text != '' && phone.text != null) {
      // Выводим в консоль весь номер для отладки
      console.log('номер телефона', phone.text);
      
      // Проверяем первый символ на наличие '+'
      if (phone.text[0] != '+')
        return {
          errorMessage: 'Номер телефона должен начинаться на +'
        };
      else {
        return null;
      }       
    }
    else {
      return null;
    }
  });

/*
* Дата создания: 23.04.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет корректность введенного второго номера телефона.
* Валидация проверяет наличие символа '+' в начале номера. При отсутствии
* данного символа выводится сообщение об ошибке.
*/

form.onChange(['u_phone_number2'])
  .validateAsync('u_phone_number2', async state => {
    // Получаем значение поля телефона
    const [phone] = state.changes;
    
    // Выводим в консоль первый и второй символы для отладки
    console.log('первый и второй элемент телефона', phone.text[0], phone.text[1]);
    
    // Проверяем что поле не пустое
    if (phone.text != '' && phone.text != null) {
      // Выводим в консоль весь номер для отладки
      console.log('номер телефона', phone.text);
      
      // Проверяем первый символ на наличие '+'
      if (phone.text[0] != '+')
        return {
          errorMessage: 'Номер телефона должен начинаться на +'
        };
      else {
        return null;
      }       
    }
    else {
      return null;
    }
  });

/*
* Дата создания: 15.05.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет наличие дублей контрагентов по ОГРН, 
* если поле ИНН не заполнено. Проверка выполняется только на нулевом этапе формы.
* При обнаружении дубля выводится сообщение об ошибке.
*/

form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)'], true)
  .validateAsync('ОГРН (Контрагент)', async state => {
    // Получаем значения полей ОГРН и ИНН
    const [ogrn_ul, inn_ul] = state.changes;

    // Если ОГРН не заполнен, пропускаем проверку
    if (!ogrn_ul)
      return null;

    // Если ОГРН заполнен, проверяем на дубли
    if (ogrn_ul.value) {
      // Ищем в реестре формы записи с таким же ОГРН
      const ogrn_duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ОГРН Контрагента', ogrn_ul.value), 
        []
      );

      // Проверяем условия для вывода ошибки:
      // 1. Текущий этап = 0
      // 2. Найдены дубли по ОГРН
      // 3. Поле ИНН пустое
      if (state.currentStep == 0 && 
          ogrn_duplicates.tasks.length != 0 && 
          inn_ul.value == '') {
        return {
          errorMessage: "Контрагент с данным ОГРН уже заведён"
        };
      }
    }
    
    // Если проверки пройдены, ошибок нет
    return null;
  });


// /*
// * Дата создания: 15.05.2024
// * Автор: Роман
// * Краткое описание: Скрипт проверяет наличие дублей контрагентов по ИНН.
// * Проверка выполняется как при пустом ОГРН, так и при заполненном.
// * При наличии дублей выводится соответствующее сообщение об ошибке.
// */

// form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)'], true)
//   .validateAsync('ИНН (Контрагент)', async state => {
//     // Получаем значения полей ОГРН и ИНН
//     const [ogrn_ul, inn_ul] = state.changes;

//     // Если ИНН не заполнен, пропускаем проверку
//     if (!inn_ul)
//       return null;

//     // Если ИНН заполнен, проверяем на дубли
//     if (inn_ul.value) {
//       // Получаем списки дублей по ОГРН и ИНН из реестра
//       const ogrn_duplicates = await form.fetchSelfRegister(
//         f => f.fieldEquals('ОГРН Контрагента', ogrn_ul.value), 
//         []
//       );
//       const inn_duplicates = await form.fetchSelfRegister(
//         f => f.fieldEquals('ИНН Контрагента', inn_ul.value), 
//         []
//       );

//       // Проверяем условие 1: пустой ОГРН и есть дубли по ИНН
//       if (state.currentStep == 0 && 
//           ogrn_ul.value == '' && 
//           inn_duplicates.tasks.length != 0) {
//         return {
//           errorMessage: "Контрагент с данным ИНН уже заведён"
//         };
//       } 
      
//       // Проверяем условие 2: есть дубли и по ОГРН, и по ИНН
//       if (state.currentStep == 0 && 
//           ogrn_duplicates.tasks.length != 0 && 
//           inn_duplicates.tasks.length != 0) {
//         return {
//           errorMessage: "Контрагент с данным ИНН и ОГРН уже заведён"
//         };
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });

// /*
// * Дата создания: 07.03.2025
// * Автор: Атлас АйТи Решения
// * Краткое описание: Скрипт проверяет наличие дублей контрагентов по ИНН.
// * Проверка учитывает КПП - если ИНН совпадает, но КПП отличается, ошибка не выводится.
// * При наличии дублей с совпадающими ИНН и КПП выводится сообщение об ошибке.
// */

// form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)', 'КПП (Контрагент)'], true)
//   .validateAsync('ИНН (Контрагент)', async state => {
//     // Получаем значения полей ОГРН, ИНН и КПП
//     const [ogrn_ul, inn_ul, kpp_ul] = state.changes;

//     // Если ИНН не заполнен, пропускаем проверку
//     if (!inn_ul || !inn_ul.value)
//       return null;

//     // Получаем списки дублей по ОГРН и ИНН из реестра
//     const ogrn_duplicates = ogrn_ul && ogrn_ul.value ? await form.fetchSelfRegister(
//       f => f.fieldEquals('ОГРН Контрагента', ogrn_ul.value), 
//       ['КПП (Контрагент)']
//     ) : { tasks: [] };
    
//     const inn_duplicates = await form.fetchSelfRegister(
//       f => f.fieldEquals('ИНН Контрагента', inn_ul.value), 
//       ['КПП (Контрагент)']
//     );

//     // Если нет данных в результатах поиска, пропускаем проверку
//     if (!inn_duplicates || !inn_duplicates.tasks)
//       return null;

//     // Проверка на этапе создания (0-й шаг)
//     if (state.currentStep == 0) {
//       // Проверяем условие 1: пустой ОГРН и есть дубли по ИНН с учетом КПП
//       if ((!ogrn_ul || !ogrn_ul.value) && inn_duplicates.tasks.length > 0) {
//         // Фильтруем задачи с совпадающим КПП
//         const kppMatches = inn_duplicates.tasks.filter(task => {
//           // Если у текущей задачи нет КПП или у найденной задачи нет КПП в поле КПП (Контрагент)
//           if (!kpp_ul || !kpp_ul.value || !task.fields[0])
//             return true; // Считаем это совпадением, если одно из значений КПП отсутствует
          
//           // Проверяем совпадение КПП
//           return task.fields[0].value === kpp_ul.value;
//         });

//         // Если найдены задачи с совпадающим ИНН и КПП
//         if (kppMatches.length > 0) {
//           return {
//             errorMessage: "Контрагент с данным ИНН и КПП уже заведён"
//           };
//         }
//       }
      
//       // Проверяем условие 2: есть дубли и по ОГРН, и по ИНН с учетом КПП
//       if (ogrn_ul && ogrn_ul.value && ogrn_duplicates.tasks.length > 0 && inn_duplicates.tasks.length > 0) {
//         // Проверяем совпадение по ОГРН и ИНН с учетом КПП
//         const kppMatches = inn_duplicates.tasks.filter(task => {
//           // Совпадение по ОГРН
//           const isOgrnMatch = ogrn_duplicates.tasks.some(ogrnTask => ogrnTask.task_id === task.task_id);
          
//           // Если нет совпадения по ОГРН, пропускаем
//           if (!isOgrnMatch) return false;
          
//           // Если у текущей задачи нет КПП или у найденной задачи нет КПП в поле КПП (Контрагент)
//           if (!kpp_ul || !kpp_ul.value || !task.fields[0])
//             return true; // Считаем это совпадением, если одно из значений КПП отсутствует
          
//           // Проверяем совпадение КПП
//           return task.fields[0].value === kpp_ul.value;
//         });
        
//         if (kppMatches.length > 0) {
//           return {
//             errorMessage: "Контрагент с данным ИНН, ОГРН и КПП уже заведён"
//           };
//         }
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });

// /*
// * Дата создания: 07.03.2025
// * Автор: Атлас АйТи Решения
// * Краткое описание: Скрипт проверяет наличие дублей контрагентов по ИНН.
// * Проверка учитывает КПП - если ИНН совпадает, но КПП отличается, ошибка не выводится.
// * При наличии дублей с совпадающими ИНН и КПП выводится сообщение об ошибке.
// */

// form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)', 'КПП (Контрагент)'], true)
//   .validateAsync('ИНН (Контрагент)', async state => {
//     // Получаем значения полей ОГРН, ИНН и КПП
//     const [ogrn_ul, inn_ul, kpp_ul] = state.changes;

//     // Если ИНН не заполнен, пропускаем проверку
//     if (!inn_ul || !inn_ul.value)
//       return null;

//     // Получаем списки дублей по ОГРН и ИНН из реестра
//     const ogrn_duplicates = ogrn_ul && ogrn_ul.value ? await form.fetchSelfRegister(
//       f => f.fieldEquals('ОГРН (Контрагент)', ogrn_ul.value), 
//       ['КПП (Контрагент)']
//     ) : { tasks: [] };
    
//     const inn_duplicates = await form.fetchSelfRegister(
//       f => f.fieldEquals('ИНН (Контрагент)', inn_ul.value), 
//       ['КПП (Контрагент)']
//     );

//     // Если нет данных в результатах поиска, пропускаем проверку
//     if (!inn_duplicates || !inn_duplicates.tasks)
//       return null;

//     // Проверка на этапе создания (0-й шаг)
//     if (state.currentStep == 0) {
//       // Проверяем дубли по ИНН с учетом КПП
//       if (inn_duplicates.tasks.length > 0) {
//         // Фильтруем задачи с совпадающим КПП
//         const kppMatches = inn_duplicates.tasks.filter(task => {
//           // Если у текущей задачи нет КПП или у найденной задачи нет КПП в поле КПП (Контрагент)
//           if (!kpp_ul || !kpp_ul.value || !task.fields[0])
//             return true; // Считаем это совпадением, если одно из значений КПП отсутствует
          
//           // Проверяем совпадение КПП
//           return task.fields[0].value === kpp_ul.value;
//         });

//         // Если найдены задачи с совпадающим ИНН и КПП
//         if (kppMatches.length > 0) {
//           return {
//             errorMessage: "Контрагент с данным ИНН и КПП уже заведён"
//           };
//         }
//       }

//       // Проверяем условие: есть дубли и по ОГРН, и по ИНН
//       if (ogrn_ul && ogrn_ul.value && ogrn_duplicates.tasks.length > 0 && inn_duplicates.tasks.length > 0) {
//         return {
//           errorMessage: "Контрагент с данным ИНН и ОГРН уже заведён"
//         };
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });

/*
* Дата создания: 07.03.2025
* Автор: Атлас АйТи Решения
* Краткое описание: Скрипт проверяет наличие дублей контрагентов по ИНН.
* Если КПП не указан, проверка выполняется только по ИНН.
* Если КПП указан, дубль считается найденным только при совпадении ИНН и КПП.
*/

  
form.onChange(['ИНН (Контрагент)', 'КПП (Контрагент)'], true)
  .validateAsync('ИНН (Контрагент)', async state => {
    console.log('Скрипт запущен, state:', state);
    
    // Получаем значения полей ИНН и КПП
    const [inn, kpp] = state.changes;
    console.log('Поле ИНН:', inn);
    console.log('Поле КПП:', kpp);
    // Если ИНН не заполнен, пропускаем проверку
    if (!inn || !inn.value) {
      console.log('ИНН не заполнен, проверка пропущена');
      return null;
    }
    // Если не на этапе создания, пропускаем проверку
    console.log('Текущий шаг:', state.currentStep);
    if (state.currentStep !== 0) {
      console.log('Не этап создания, проверка пропущена');
      return null;
    }
    console.log('Выполняем запрос к реестру по ИНН:', inn.value);
    
    try {
      // Получаем список контрагентов с таким же ИНН
      const duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ИНН (Контрагент)', inn), 
        ['КПП (Контрагент)']
      );
      
      console.log('Результаты запроса к реестру:', duplicates);
      // Если нет дублей или результат запроса некорректен, пропускаем проверку
      if (!duplicates || !duplicates.tasks || duplicates.tasks.length === 0) {
        console.log('Дубли не найдены, проверка пропущена');
        return null;
      }
      
      // Проверка текущей задачи
      const currentTaskId = state.taskId;
      console.log('ID текущей задачи:', currentTaskId);
      
      // Фильтруем список, исключая текущую задачу
      const otherTasks = duplicates.tasks.filter(task => task.task_id != currentTaskId);
      console.log('Задачи после фильтрации (без текущей):', otherTasks);
      
      if (otherTasks.length === 0) {
        console.log('После фильтрации задач не осталось');
        return null;
      }
      
      console.log('Найдено потенциальных дублей (без текущей задачи):', otherTasks.length);
      
      // Если КПП не указан, проверяем наличие дублей только по ИНН
      if (!kpp || !kpp.value) {
        console.log('КПП не указан, проверка только по ИНН');
        return {
          errorMessage: "Контрагент с данным ИНН уже заведён"
        };
      }
      
      // Если КПП указан, проверяем наличие дублей с совпадающим КПП
      console.log('Проверка совпадений по КПП:', kpp.value);
      const kppMatches = otherTasks.filter(task => {
        console.log('Проверяем задачу:', task.task_id, 'КПП в задаче:', task.fields[0]);
        
        // Если у найденной задачи нет поля КПП, считаем это совпадением
        if (!task.fields[0]) {
          console.log('В задаче нет КПП, считаем совпадением');
          return true;
        }
        
        // Проверяем совпадение КПП
        const isMatch = task.fields[0].text === kpp.value;
        console.log('Совпадение КПП (text):', isMatch);
        
        // Проверим еще и как value на всякий случай
        if (task.fields[0].value) {
          const isValueMatch = task.fields[0].value === kpp.value;
          console.log('Совпадение КПП (value):', isValueMatch);
        }
        
        return isMatch;
      });
      
      console.log('Найдено дублей с совпадающим КПП:', kppMatches.length);
      console.log('Совпадающие дубли:', kppMatches);
      
      // Если найдены дубли с совпадающим КПП, выводим ошибку
      if (kppMatches.length > 0) {
        console.log('Обнаружены дубли, выводим ошибку');
        const errorObj = {
          errorMessage: "Контрагент с данным ИНН и КПП уже заведён"
        };
        console.log('Объект ошибки:', errorObj);
        return errorObj;
      }
      
      console.log('Дублей с совпадающим КПП не найдено, проверка пройдена');
    } catch (error) {
      console.log('Ошибка при выполнении запроса к реестру:', error);
      return null;
    }
    
    // Если все проверки пройдены успешно, ошибок нет
    console.log('Все проверки пройдены успешно');
    return null;
  });
  



/*
* Дата создания: 14.03.2025
* Автор: Атлас АйТи Решения
* Краткое описание: Скрипт автоматически устанавливает галочку "Обособленное подразделение", 
* если заводится контрагент с существующим ИНН, но новым КПП.
*/

form.onChange(['ИНН (Контрагент)', 'КПП (Контрагент)'])
  .setValueAsync('Обособленное подразделение', async state => {
    // Получаем значения полей ИНН и КПП
    const [inn, kpp] = state.changes;
    
    // Если ИНН не заполнен, пропускаем проверку
    if (!inn || !inn.value) {
      return null;
    }
    
    // Если КПП не заполнен, пропускаем проверку
    if (!kpp || !kpp.value) {
      return null;
    }
    
    try {
      // Получаем список контрагентов с таким же ИНН
      const duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ИНН (Контрагент)', inn), 
        ['КПП (Контрагент)']
      );
      
      // Если нет дублей или результат запроса некорректен, пропускаем проверку
      if (!duplicates || !duplicates.tasks || duplicates.tasks.length === 0) {
        return null;
      }
      
      // Проверка текущей задачи
      const currentTaskId = state.taskId;
      
      // Фильтруем список, исключая текущую задачу
      const otherTasks = duplicates.tasks.filter(task => task.task_id != currentTaskId);
      
      if (otherTasks.length === 0) {
        return null;
      }
      
      // Проверяем, есть ли дубли с совпадающим КПП
      const kppMatches = otherTasks.filter(task => {
        if (!task.fields[0]) {
          return false;
        }
        return task.fields[0].text === kpp.value || task.fields[0].value === kpp.value;
      });
      
      // Если найдены дубли с совпадающим КПП, не ставим галочку
      if (kppMatches.length > 0) {
        return null;
      }
      
      // Если есть совпадения по ИНН, но не по КПП - ставим галочку
      if (otherTasks.length > 0) {
        return "checked";
      }
    } catch (error) {
      return null;
    }
    
    return null;
  });




/*
* Дата создания: 15.05.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет наличие дублей контрагентов-ИП по ОГРН,
* если поле ИНН не заполнено. Проверка выполняется только на нулевом этапе формы.
* При обнаружении дубля выводится сообщение об ошибке.
*/

form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)'], true)
  .validateAsync('ОГРН (Контрагент)', async state => {
    // Получаем значения полей ОГРН и ИНН
    const [ogrn_ul, inn_ul] = state.changes;

    // Если ОГРН не заполнен, пропускаем проверку
    if (!ogrn_ul)
      return null;

    // Если ОГРН заполнен, проверяем на дубли
    if (ogrn_ul.value) {
      // Ищем в реестре формы записи с таким же ОГРН
      const ogrn_duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ОГРН Контрагента', ogrn_ul.value), 
        []
      );

      // Проверяем условия для вывода ошибки:
      // 1. Текущий этап = 0
      // 2. Найдены дубли по ОГРН
      // 3. Поле ИНН пустое
      if (state.currentStep == 0 && 
          ogrn_duplicates.tasks.length != 0 && 
          inn_ul.value == '') {
        return {
          errorMessage: "Контрагент с данным ОГРН уже заведён"
        };
      }
    }
    
    // Если проверки пройдены, ошибок нет
    return null;
  });

  
// /*
// * Дата создания: 15.05.2024
// * Автор: Роман
// * Краткое описание: Скрипт проверяет наличие дублей контрагентов-ИП по ИНН.
// * Проверка выполняется как при пустом ОГРН, так и при заполненном.
// * При обнаружении дублей выводится соответствующее сообщение об ошибке.
// */

// form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)'], true)
//   .validateAsync('ИНН (Контрагент)', async state => {
//     // Получаем значения полей ОГРН и ИНН
//     const [ogrn_ul, inn_ul] = state.changes;

//     // Если ИНН не заполнен, пропускаем проверку
//     if (!inn_ul)
//       return null;

//     // Если ИНН заполнен, проверяем на дубли
//     if (inn_ul.value) {
//       // Получаем списки дублей по ОГРН и ИНН из реестра
//       const ogrn_duplicates = await form.fetchSelfRegister(
//         f => f.fieldEquals('ОГРН Контрагента', ogrn_ul.value), 
//         []
//       );
//       const inn_duplicates = await form.fetchSelfRegister(
//         f => f.fieldEquals('ИНН Контрагента', inn_ul.value), 
//         []
//       );

//       // Проверяем условие 1: пустой ОГРН и есть дубли по ИНН
//       if (state.currentStep == 0 && 
//           ogrn_ul.value == '' && 
//           inn_duplicates.tasks.length != 0) {
//         return {
//           errorMessage: "Контрагент с данным ИНН уже заведён"
//         };
//       }
      
//       // Проверяем условие 2: есть дубли и по ОГРН, и по ИНН
//       if (state.currentStep == 0 && 
//           ogrn_duplicates.tasks.length != 0 && 
//           inn_duplicates.tasks.length != 0) {
//         return {
//           errorMessage: "Контрагент с данным ИНН и ОГРН уже заведён"
//         };
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });

/*
* Дата создания: 07.03.2025
* Автор: Атлас АйТи Решения
* Краткое описание: Скрипт проверяет наличие дублей контрагентов-ИП по ИНН.
* Проверка учитывает КПП - если ИНН совпадает, но КПП отличается, ошибка не выводится.
* При наличии дублей с совпадающими ИНН и КПП выводится сообщение об ошибке.
*/

// form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)', 'КПП (Контрагент)'], true)
//   .validateAsync('ИНН (Контрагент)', async state => {
//     // Получаем значения полей ОГРН, ИНН и КПП
//     const [ogrn_ip, inn_ip, kpp_ip] = state.changes;

//     // Если ИНН не заполнен, пропускаем проверку
//     if (!inn_ip || !inn_ip.value)
//       return null;

//     // Получаем списки дублей по ОГРН и ИНН из реестра
//     const ogrn_duplicates = ogrn_ip && ogrn_ip.value ? await form.fetchSelfRegister(
//       f => f.fieldEquals('ОГРН Контрагента', ogrn_ip.value), 
//       ['КПП (Контрагент)']
//     ) : { tasks: [] };
    
//     const inn_duplicates = await form.fetchSelfRegister(
//       f => f.fieldEquals('ИНН Контрагента', inn_ip.value), 
//       ['КПП (Контрагент)']
//     );

//     // Если нет данных в результатах поиска, пропускаем проверку
//     if (!inn_duplicates || !inn_duplicates.tasks)
//       return null;

//     // Проверка на этапе создания (0-й шаг)
//     if (state.currentStep == 0) {
//       // Проверяем дубли по ИНН с учетом КПП
//       if (inn_duplicates.tasks.length > 0) {
//         // Фильтруем задачи с совпадающим КПП
//         const kppMatches = inn_duplicates.tasks.filter(task => {
//           // Если у текущей задачи нет КПП или у найденной задачи нет КПП в поле КПП (Контрагент)
//           if (!kpp_ip || !kpp_ip.value || !task.fields[0])
//             return true; // Считаем это совпадением, если одно из значений КПП отсутствует
          
//           // Проверяем совпадение КПП
//           return task.fields[0].value === kpp_ip.value;
//         });

//         // Если найдены задачи с совпадающим ИНН и КПП
//         if (kppMatches.length > 0) {
//           return {
//             errorMessage: "Контрагент-ИП с данным ИНН и КПП уже заведён"
//           };
//         }
//       }

//       // Проверяем условие: есть дубли и по ОГРН, и по ИНН
//       if (ogrn_ip && ogrn_ip.value && ogrn_duplicates.tasks.length > 0 && inn_duplicates.tasks.length > 0) {
//         return {
//           errorMessage: "Контрагент-ИП с данным ИНН и ОГРН уже заведён"
//         };
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });

// /*
// * Дата создания: 07.03.2025
// * Автор: Атлас АйТи Решения
// * Краткое описание: Скрипт проверяет наличие дублей контрагентов-ИП по ИНН.
// * Проверка учитывает КПП - если ИНН совпадает, но КПП отличается, ошибка не выводится.
// * При наличии дублей с совпадающими ИНН и КПП выводится сообщение об ошибке.
// */

// form.onChange(['ОГРН (Контрагент)', 'ИНН (Контрагент)', 'КПП (Контрагент)'], true)
//   .validateAsync('ИНН (Контрагент)', async state => {
//     // Получаем значения полей ОГРН, ИНН и КПП
//     const [ogrn_ip, inn_ip, kpp_ip] = state.changes;

//     // Если ИНН не заполнен, пропускаем проверку
//     if (!inn_ip || !inn_ip.value)
//       return null;

//     // Получаем списки дублей по ОГРН и ИНН из реестра
//     const ogrn_duplicates = ogrn_ip && ogrn_ip.value ? await form.fetchSelfRegister(
//       f => f.fieldEquals('ОГРН Контрагента', ogrn_ip.value), 
//       ['КПП (Контрагент)']
//     ) : { tasks: [] };
    
//     const inn_duplicates = await form.fetchSelfRegister(
//       f => f.fieldEquals('ИНН Контрагента', inn_ip.value), 
//       ['КПП (Контрагент)']
//     );

//     // Если нет данных в результатах поиска, пропускаем проверку
//     if (!inn_duplicates || !inn_duplicates.tasks)
//       return null;

//     // Проверка на этапе создания (0-й шаг)
//     if (state.currentStep == 0) {
//       // Проверяем дубли по ИНН с учетом КПП
//       if (inn_duplicates.tasks.length > 0) {
//         // Фильтруем задачи с совпадающим КПП
//         const kppMatches = inn_duplicates.tasks.filter(task => {
//           // Если у текущей задачи нет КПП или у найденной задачи нет КПП в поле КПП (Контрагент)
//           if (!kpp_ip || !kpp_ip.value || !task.fields[0])
//             return true; // Считаем это совпадением, если одно из значений КПП отсутствует
          
//           // Проверяем совпадение КПП
//           return task.fields[0].value === kpp_ip.value;
//         });

//         // Если найдены задачи с совпадающим ИНН и КПП
//         if (kppMatches.length > 0) {
//           return {
//             errorMessage: "Контрагент-ИП с данным ИНН и КПП уже заведён"
//           };
//         }
//       }

//       // Проверяем условие: есть дубли и по ОГРН, и по ИНН с учетом КПП
//       if (ogrn_ip && ogrn_ip.value && ogrn_duplicates.tasks.length > 0 && inn_duplicates.tasks.length > 0) {
//         // Проверяем совпадение по ОГРН и ИНН с учетом КПП
//         const kppMatches = inn_duplicates.tasks.filter(task => {
//           // Совпадение по ОГРН
//           const isOgrnMatch = ogrn_duplicates.tasks.some(ogrnTask => ogrnTask.task_id === task.task_id);
          
//           // Если нет совпадения по ОГРН, пропускаем
//           if (!isOgrnMatch) return false;
          
//           // Если у текущей задачи нет КПП или у найденной задачи нет КПП в поле КПП (Контрагент)
//           if (!kpp_ip || !kpp_ip.value || !task.fields[0])
//             return true; // Считаем это совпадением, если одно из значений КПП отсутствует
          
//           // Проверяем совпадение КПП
//           return task.fields[0].value === kpp_ip.value;
//         });
        
//         if (kppMatches.length > 0) {
//           return {
//             errorMessage: "Контрагент-ИП с данным ИНН, ОГРН и КПП уже заведён"
//           };
//         }
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });


/*
* Дата создания: 16.05.2024
* Автор: Роман
* Краткое описание: Скрипт блокирует создание дублей контрагентов (юр. лиц или ИП) 
* по ИНН, если поле ОГРН не заполнено. Проверка выполняется только на нулевом этапе формы.
* При обнаружении дубля выводится сообщение об ошибке.
*/

form.onChange(['ИНН Контрагента', 'ОГРН Контрагента'], true)
  .validateAsync('ИНН Контрагента', async state => {
    // Получаем значения полей ИНН и ОГРН
    const [inn, ogrn] = state.changes;

    // Если ИНН не заполнен, пропускаем проверку
    if (!inn)
      return null;

    // Если ИНН заполнен, проверяем на дубли
    if (inn.value) {
      // Ищем в реестре формы записи с таким же ИНН
      const inn_duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ИНН Контрагента', inn.value), 
        []
      );

      // Проверяем условия для блокировки:
      // 1. Текущий этап = 0
      // 2. Найдены дубли по ИНН
      // 3. Поле ОГРН пустое
      if (state.currentStep == 0 && 
          inn_duplicates.tasks.length != 0 && 
          ogrn.value == '') {
        return {
          errorMessage: "Контрагент с данным ИНН уже заведён"
        };
      }
    }
    
    // Если проверки пройдены, ошибок нет
    return null;
  });

// /*
// * Дата создания: 16.05.2024
// * Автор: Роман
// * Краткое описание: Скрипт блокирует создание дублей контрагентов (юр. лиц или ИП)
// * по ОГРН. Работает как при пустом ИНН, так и при заполненном.
// * При обнаружении дублей выводит соответствующее сообщение об ошибке.
// */

// form.onChange(['ИНН Контрагента', 'ОГРН Контрагента'], true)
//   .validateAsync('ОГРН Контрагента', async state => {
//     // Получаем значения полей ИНН и ОГРН
//     const [inn, ogrn] = state.changes;

//     // Если ОГРН не заполнен, пропускаем проверку
//     if (!ogrn)
//       return null;

//     // Если ОГРН заполнен, проверяем на дубли
//     if (ogrn.value) {
//       // Получаем списки дублей по ОГРН и ИНН из реестра
//       const ogrn_duplicates = await form.fetchSelfRegister(
//         f => f.fieldEquals('ОГРН Контрагента', ogrn.value), 
//         []
//       );
//       const inn_duplicates = await form.fetchSelfRegister(
//         f => f.fieldEquals('ИНН Контрагента', inn.value), 
//         []
//       );

//       // Проверяем условие 1: пустой ИНН и есть дубли по ОГРН
//       if (state.currentStep == 0 && 
//           inn.value == '' && 
//           ogrn_duplicates.tasks.length != 0) {
//         return {
//           errorMessage: "Контрагент с данным ОГРН уже заведён"
//         };
//       }
      
//       // Проверяем условие 2: есть дубли и по ИНН, и по ОГРН
//       if (state.currentStep == 0 && 
//           inn_duplicates.tasks.length != 0 && 
//           ogrn_duplicates.tasks.length != 0) {
//         return {
//           errorMessage: "Контрагент с данным ИНН и ОГРН уже заведён"
//         };
//       }
//     }

//     // Если проверки пройдены, ошибок нет
//     return null;
//   });





/*
* Дата создания: 15.05.2024
* Автор: Роман
* Краткое описание: Скрипт блокирует создание дублей физических лиц по ИНН, 
* если поле СНИЛС не заполнено. Проверка выполняется только на нулевом этапе формы.
* При обнаружении дубля выводится сообщение об ошибке.
*/

form.onChange(['ИНН ФЛ', 'СНИЛС'], true)
  .validateAsync('ИНН ФЛ', async state => {
    // Получаем значения полей ИНН и СНИЛС
    const [inn_FL, snils] = state.changes;

    // Если ИНН не заполнен, пропускаем проверку
    if (!inn_FL)
      return null;

    // Если ИНН заполнен, проверяем на дубли
    if (inn_FL.value) {
      // Ищем в реестре формы записи с таким же ИНН
      const inn_duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ИНН Контрагента', inn_FL.value), 
        []
      );

      // Проверяем условия для блокировки:
      // 1. Текущий этап = 0
      // 2. Найдены дубли по ИНН
      // 3. Поле СНИЛС пустое
      if (state.currentStep == 0 && 
          inn_duplicates.tasks.length != 0 && 
          snils.value == '') {
        return {
          errorMessage: "Контрагент с данным ИНН уже заведён"
        };
      }
    }
    
    // Если проверки пройдены, ошибок нет
    return null;
  });


/*
* Дата создания: 15.05.2024
* Автор: Роман
* Краткое описание: Скрипт блокирует создание дублей физических лиц по СНИЛС.
* Проверка выполняется как при пустом ИНН, так и при заполненном.
* При обнаружении дублей выводит соответствующее сообщение об ошибке.
*/

form.onChange(['ИНН ФЛ', 'СНИЛС'], true)
  .validateAsync('СНИЛС', async state => {
    // Получаем значения полей ИНН и СНИЛС
    const [inn_FL, snils] = state.changes;

    // Если СНИЛС не заполнен, пропускаем проверку
    if (!snils)
      return null;

    // Если СНИЛС заполнен, проверяем на дубли
    if (snils.value) {
      // Получаем списки дублей по СНИЛС и ИНН из реестра
      const snils_duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('СНИЛС', snils.value), 
        []
      );
      const inn_duplicates = await form.fetchSelfRegister(
        f => f.fieldEquals('ИНН ФЛ', inn_FL.value), 
        []
      );

      // Проверяем условие 1: пустой ИНН и есть дубли по СНИЛС
      if (state.currentStep == 0 && 
          inn_FL.value == '' && 
          snils_duplicates.tasks.length != 0) {
        return {
          errorMessage: "Контрагент с данным СНИЛС уже заведён"
        };
      }
      
      // Проверяем условие 2: есть дубли и по ИНН, и по СНИЛС
      if (state.currentStep == 0 && 
          inn_duplicates.tasks.length != 0 && 
          snils_duplicates.tasks.length != 0) {
        return {
          errorMessage: "Контрагент с данным ИНН и СНИЛС уже заведён"
        };
      }
    }

    // Если проверки пройдены, ошибок нет
    return null;
  });


/*
* Дата создания: 17.05.2024
* Автор: Роман
* Краткое описание: Скрипт копирует первые три буквы из поля "Контрагент" 
* в служебное поле "ОПФ контрагента". Используется для автоматического 
* определения организационно-правовой формы контрагента.
*/

form.onChange(['u_counterparty'], true)
  .setValues(['ОПФ контрагента'], state => {
    const [counterparty] = state.changes;
    
    // Проверяем наличие значения
    if (!counterparty || !counterparty.text) {
      return [null];
    }
    
    // Возвращаем первые три символа из названия контрагента
    return [counterparty.text.substring(0, 3)];
});

/*
* Дата создания: 09.10.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет соответствие типа контрагента (ЮЛ/ИП) 
* и организационно-правовой формы. Блокирует сохранение формы при несоответствии
* типа контрагента и ОПФ, определяемой по первым трем символам названия.
*/

form.onChange(['Тип контрагента', 'ОПФ контрагента'])
  .validateAsync('Тип контрагента', async state => {
    const [type, orgForm] = state.changes;
    
    // Проверка наличия данных
    if (!type?.columns) {
      return null;
    }
    
    const typeValue = type.columns['Орг.-правовая форма'];
    const formValue = orgForm?.text;
    
    // Проверка для юридических лиц
    if (typeValue === 'ЮЛ' && formValue?.substring(0, 3) === 'ИП ') {
      return {
        errorMessage: "Тип контрагента - ЮЛ - не соответствует ИНН"
      };
    }
    
    // Проверка для индивидуальных предпринимателей
    if (typeValue === 'ИП' && 
        formValue?.substring(0, 3) !== 'ИП ' && 
        orgForm?.value != null && 
        orgForm?.value !== "") {
      return {
        errorMessage: "Тип контрагента не соответствует ИНН принадлежащего ЮЛ"
      };
    }
    
    return null;
});

/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт добавляет префикс "КПП " к значению поля КПП контрагента 
* и записывает результат в поле шаблона КПП. При пустом значении КПП очищает поле шаблона.
*/

form.onChange(['КПП (Контрагент)'])
  .setValues(['u_template_cpp'], state => {
    const [kpp] = state.changes;
    
    // Проверяем, что значение КПП существует и не пустое
    if (!kpp?.value) {
      return [null];
    }
    
    // Формируем строку с префиксом КПП
    return ['КПП ' + kpp.value];
});


/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт копирует банковские реквизиты из таблицы "Основные реквизиты" 
* в соответствующие поля формы. Учитывает тип контрагента (ФЛ/СМЗ или другие) 
* при выборе номера счета. Копирует только активные (где выбрано "Да") реквизиты.
*/

form.onChange([
  'u_type_counterparty', 
  'Основные реквизиты',
  '№ р/счёта',
  '№ счёта',
  'Банк',
  'БИК (Банк)',
  'Кор. счет (Банк)',
  'Адрес (Банк)'
])
.setValues([
  'Расчётный счёт контрагента',
  'Банк контрагента',
  'БИК банка',
  'Кор. счет (Банк контрагента)',
  'Адрес (Банк контрагента)'
], state => {
  const [
    typeCounterparty,
    requisites,
    accountUL,
    accountFL,
    bank,
    bik,
    corrAccount,
    address
  ] = state.changes;

  // Инициализация пустых значений
  const emptyValues = [null, null, null, null, null];
  
  // Проверка наличия типа контрагента
  if (!typeCounterparty?.columns) {
    return emptyValues;
  }

  // Проверка наличия реквизитов
  if (!requisites?.rows?.length) {
    return emptyValues;
  }

  // Поиск активной строки реквизитов
  for (let i = 0; i < requisites.rows.length; i++) {
    const row = requisites.rows[i];
    if (!row || row.choice_name !== 'Да') {
      continue;
    }

    // Определение номера счета в зависимости от типа контрагента
    const isPersonalAccount = ['ФЛ', 'СМЗ'].includes(typeCounterparty.columns["Орг.-правовая форма"]);
    const account = isPersonalAccount ? accountFL.rows[i].text : accountUL.rows[i].text;

    // Формирование результата с заполненными реквизитами
    return [
      account,
      bank.rows[i].text,
      bik.rows[i].text,
      corrAccount.rows[i].text,
      address.rows[i].text
    ];
  }

  // Возврат пустых значений, если активная строка не найдена
  return emptyValues;
}); 


  
/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет, что только одна строка в таблице "Основные реквизиты" 
* помечена как основная (значение "Да"). При попытке отметить несколько строк выводит 
* сообщение об ошибке.
*/

form.onChange(['Основные реквизиты'])
  .validateAsync('Основные реквизиты', async state => {
    const [requisites] = state.changes;

    // Проверка наличия данных
    if (!requisites?.rows?.length) {
      return null;
    }

    // Подсчет количества активных строк
    const activeRowsCount = requisites.rows.reduce((count, row) => 
      row.choice_name === 'Да' ? count + 1 : count, 0);

    // Проверка на превышение лимита активных строк
    if (activeRowsCount > 1) {
      return {
        errorMessage: 'Основые реквизиты могут быть только одни. Сначала уберите отметку с предыдущих основных реквизитов.'
      };
    }

    return null;
  });

/*
* Дата создания: 31.10.2024
* Дата редактирования: 16.12.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет заполненность обязательных полей контрагента 
* в зависимости от страны регистрации (РФ/Не РФ). При отсутствии обязательных данных 
* устанавливает флаг "По контрагенту заполнена не вся информация".
*/

form.onChange([
  'u_country',
  'u_type_counterparty',
  'u_adress_counterparty',
  'u_mail_address_script',
  'Расчётный счёт контрагента',
  'Банк',
  'u_counterparty_foreign',
  'Регистрационный номер',
  'Наименование получателя (Receiver name)'
], true)
.setValues(['u_counterparty_information'], state => {
  const [
    country,
    typeCounterparty,
    regAddress,
    mailAddress,
    accountNumber,
    bank,
    foreignCounterparty,
    regNumber,
    receiverName
  ] = state.changes;

  // Проверка наличия страны контрагента
  if (!country?.columns) {
    console.log('Не указана страна контрагента');
    return ['checked'];
  }

  const countryType = country.columns['Страна регистрации КА'];
  const isAfterFirstStep = state.currentStep > 0;

  // Проверка для иностранных контрагентов
  if (countryType === 'Не РФ') {
    const isForeignFieldsMissing = isAfterFirstStep && (
      !foreignCounterparty?.value ||
      !regNumber?.value ||
      !receiverName?.value
    );

    if (isForeignFieldsMissing) {
      console.log('Не РФ. По клиенту не внесены все обязательные поля:', 
        { foreignCounterparty, regNumber, receiverName });
      return ['checked'];
    }
    return ['unchecked'];
  }

  // Проверка для российских контрагентов
  if (countryType === 'РФ') {
    if (!typeCounterparty?.columns) {
      console.log('Не указан тип контрагента');
      return ['checked'];
    }

    const isRussianFieldsMissing = isAfterFirstStep && (
      !typeCounterparty?.columns ||
      !regAddress?.value ||
      !mailAddress?.value ||
      !accountNumber?.value ||
      !bank?.value
    );

    if (isRussianFieldsMissing) {
      console.log('По клиенту не внесены все обязательные поля:', 
        { typeCounterparty, regAddress, mailAddress, accountNumber, bank });
      return ['checked'];
    }
    return ['unchecked'];
  }

  return ['checked'];
});

/*
* Дата создания: 23.09.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет, что длина расчетного счета для ИП и ЮЛ
* строго равна 20 символам. При несоответствии выводит сообщение об ошибке.
*/

form.onChange(['№ р/счёта'])
  .validateAsync('№ р/счёта', async state => {
    const [accountNumber] = state.changes;
    
    // Пропускаем валидацию если поле пустое
    if (!accountNumber?.value) {
      return null;
    }
    
    // Проверяем длину расчетного счета
    if (accountNumber.value.length !== 20) {
      return {
        errorMessage: 'В расчётном счету должно быть 20 символов'
      };
    }
    
    return null;
  });

/*
* Дата создания: 23.09.2024
* Автор: Роман
* Краткое описание: Скрипт проверяет, что длина расчетного счета для физических лиц 
* и самозанятых строго равна 20 символам. При несоответствии выводит сообщение 
* об ошибке.
*/

form.onChange(['№ счёта'])
  .validateAsync('№ счёта', async state => {
    const [accountNumber] = state.changes;
    
    // Пропускаем валидацию если поле пустое
    if (!accountNumber?.value) {
      return null;
    }
    
    // Проверяем длину счета
    if (accountNumber.value.length !== 20) {
      return {
        errorMessage: 'В расчётном счету должно быть 20 символов'
      };
    }
    
    return null;
  });


/*
* Дата создания: 03.10.2024
* Автор: Роман
* Краткое описание: Скрипт объединяет данные о контрагенте из разных полей 
* (наименование организации, ФИО, наименование иностранного контрагента) 
* в единое поле для использования в печатном шаблоне.
*/

form.onChange([
  'Наименование (Контрагент)', 
  'Фамилия, Имя, Отчество', 
  'u_counterparty_foreign'
], true)
.setValues(['u_counterparty_name'], state => {
  const [companyName, fullName, foreignName] = state.changes;
  
  console.log('Записываем наименование контрагента:', {
    companyName,
    fullName,
    foreignName
  });

  // Проверяем наличие наименования организации
  if (companyName?.value) {
    return [companyName.value];
  }
  
  // Проверяем наличие ФИО
  if (fullName?.value) {
    return [fullName.value];
  }
  
  // Проверяем наличие наименования иностранного контрагента
  if (foreignName?.value) {
    return [foreignName.value];
  }
  
  // Если ни одно из полей не заполнено, возвращаем пустую строку
  return [''];
});

/*
* Дата создания: 03.10.2024
* Автор: Роман
* Краткое описание: Скрипт объединяет данные о должности контрагента из двух полей 
* (должность и должность иностранного контрагента) в единое поле для 
* использования в печатном шаблоне.
*/

form.onChange([
  'Должность (Контрагент)', 
  'u_position_foreign'
], true)
.setValues(['u_counterparty_position'], state => {
  const [localPosition, foreignPosition] = state.changes;
  
  // Проверяем наличие локальной должности
  if (localPosition?.value) {
    return [localPosition.value];
  }
  
  // Проверяем наличие иностранной должности
  if (foreignPosition?.value) {
    return [foreignPosition.value];
  }
  
  // Если ни одно из полей не заполнено, возвращаем пустую строку
  return [''];
});


//Козловская В. 03.10.2024. Указываем Фамилию И.О. в зависимости от типа контрагента
/*
form.onChange(['Руководитель (Контрагент)', 'u_type_counterparty', 'u_counterparty', 'u_fio', 'u_country']).setValues(['u_initial'], 
    state => {
        const [head_counterparty,type_counterparty, counterparty, fio, country] = state.changes;
        console.log('записываем Фамилию И.О.', counterparty, type_counterparty, head_counterparty)
        if (!country || !country.columns)
          return null
        else 
          {
          if (country.columns['Страна регистрации КА']=='РФ')
            {
            if (!type_counterparty || !type_counterparty.columns)
              return null
            else if (type_counterparty.columns['Орг.-правовая форма'] == 'ИП')
              {
              if (counterparty.value!=null && counterparty.value!='' ) {
                    const substring_counterparty = counterparty.text.substring(3)
                    if (!head_counterparty || !head_counterparty.text) return null
                    const parts = substring_counterparty.split(' ')
                    if (parts.length === 0) return null 
                      const lastName = parts[0]; // Фамилия
                      const firstNameInitial = parts[1][0] + '. '; // Первая буква имени с точкой
                      var patronymicInitial = ""
                      if (parts.length>2) 
                        {
                        var patronymicInitial = parts[2][0] + '.'; // Первая буква отчества с точкой                 
                        } 
                      return [lastName+ ' ' +firstNameInitial+patronymicInitial]             
                }
              else 
                {
                  return [null]
                }          
              }
            else if (type_counterparty.columns['Орг.-правовая форма'] == 'ЮЛ')
              {
               if (!head_counterparty.value || !head_counterparty) return null
               else 
                {
                 const parts = head_counterparty.text.split(' ')            
                  const lastName = parts[0]; // Фамилия
                  const firstNameInitial = parts[1][0] + '. '; // Первая буква имени с точкой
                  var patronymicInitial = ""
                  if (parts.length>2) 
                    {
                    var patronymicInitial = parts[2][0] + '.'; // Первая буква отчества с точкой                 
                    } 
                  return [lastName+ ' ' +firstNameInitial+patronymicInitial]                     
                }       
              }
            else if (type_counterparty.columns['Орг.-правовая форма'] == 'СМЗ' || type_counterparty.columns['Орг.-правовая форма'] == 'ФЛ')
                {
                if (fio.value!=null && fio.value!='' ) {
                  console.log('Физ лицо или самозанятый', parts)
                    var parts = fio.value.split(' ') 
                    var lastName =  ""
                    var patronymicInitial = ""
                    var firstNameInitial = "";
                    if (parts.length>1)
                      {
                      var lastName = parts[0]; // Фамилия
                      var firstNameInitial = parts[1][0] + '. '; // Первая буква имени с точкой       
                      if (parts.length>2) 
                        {
                        var patronymicInitial = parts[2][0] + '.'; // Первая буква отчества с точкой                 
                        }
                      console.log('делим ФИО у физ.лица', parts, lastName, parts[3], firstNameInitial)                      
                      }           
                    return [lastName+ ' ' +firstNameInitial+patronymicInitial] 
                  }      
                else 
                  {
                    return [null]
                  }                 
                }
            }      
          else if (country.columns['Страна регистрации КА']=='Не РФ')
              {
              return [null]             
              }                          
          }      
    }); 
*/


/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт формирует инициалы руководителя/представителя контрагента 
* в зависимости от организационно-правовой формы и страны регистрации.
* Работает с полями формы, связанными с контрагентом, и возвращает
* отформатированные инициалы в соответствующее поле.
*/

// Функция форматирования ФИО в инициалы
function formatFullName(fullName) {
  if (!fullName) return null;
  
  // Разбиваем полное имя на части
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return null;
  
  // Получаем фамилию и первые буквы имени и отчества
  const lastName = parts[0];
  const initials = parts.slice(1)
    .map(part => part[0] ? part[0].toUpperCase() + '.' : '')
    .join('');
    
  return `${lastName} ${initials}`;
}

// Основной обработчик формы
form.onChange([
  'Руководитель (Контрагент)',
  'u_type_counterparty',
  'u_counterparty',
  'u_fio',
  'u_country'
]).setValues(['u_initial'], state => {
  const [headCounterparty, typeCounterparty, counterparty, fio, country] = state.changes;
  
  // Проверка наличия данных о стране
  if (!country?.columns?.['Страна регистрации КА']) {
    return [null];
  }
  
  // Для нерезидентов РФ возвращаем null
  if (country.columns['Страна регистрации КА'] !== 'РФ') {
    return [null];
  }
  
  // Проверка наличия типа контрагента
  if (!typeCounterparty?.columns?.['Орг.-правовая форма']) {
    return [null];
  }
  
  const legalForm = typeCounterparty.columns['Орг.-правовая форма'];
  
  // Обработка в зависимости от организационно-правовой формы
  switch (legalForm) {
    case 'ИП':
      // Для ИП берем ФИО из названия, убирая префикс "ИП "
      if (!counterparty?.text) return [null];
      return [formatFullName(counterparty.text.substring(3))];
      
    case 'ЮЛ':
      // Для юридических лиц берем ФИО руководителя
      if (!headCounterparty?.text) return [null];
      return [formatFullName(headCounterparty.text)];
      
    case 'СМЗ':
    case 'ФЛ':
      // Для самозанятых и физлиц берем значение из поля ФИО
      if (!fio?.value) return [null];
      return [formatFullName(fio.value)];
      
    default:
      return [null];
  }
});



/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт определяет почтовый адрес на основе нескольких полей адреса 
* с приоритизацией. Проверяет последовательно все возможные поля с адресами
* и возвращает первое непустое значение в порядке приоритета.
*/

form.onChange([
  'u_match_mail_address_foreign', 
  'u_match2_mail_address_foreign', 
  'u_match_mail_address', 
  'u_mail_address'
], true)
.setValues(['u_mail_address_script'], state => {
  const [
    matchMailAddressForeign,
    match2MailAddressForeign, 
    matchMailAddress,
    mailAddress
  ] = state.changes;

  // Проверяем каждое поле адреса в порядке приоритета
  // и возвращаем первое непустое значение
  
  // 1. Приоритет - иностранный адрес первого типа
  if (matchMailAddressForeign?.value) {
    return [matchMailAddressForeign.value];
  }
  
  // 2. Приоритет - иностранный адрес второго типа
  if (match2MailAddressForeign?.value) {
    return [matchMailAddress.value];
  }
  
  // 3. Приоритет - обычный почтовый адрес
  if (matchMailAddress?.value) {
    return [matchMailAddress.value];
  }
  
  // 4. Приоритет - базовый почтовый адрес
  if (mailAddress?.value) {
    return [mailAddress.value];
  }
  
  // Если все поля пустые, возвращаем пустую строку
  return [''];
});

/*
* Дата создания: 27.11.2024
* Автор: Роман
* Краткое описание: Скрипт определяет краткое наименование контрагента на основе 
* приоритетных полей: основного наименования, ФИО или иностранного наименования.
* При наличии значения в поле с более высоким приоритетом использует его.
*/

form.onChange([
  'u_counterparty', 
  'Фамилия, Имя, Отчество', 
  'u_counterparty_foreign'
], true)
.setValues(['u_counterparty_name_short'], state => {
  const [
    counterpartyShort, 
    fullName, 
    counterpartyForeign
  ] = state.changes;
  
  console.log(
    'Записываем наименование контрагента:', 
    {counterpartyShort, fullName, counterpartyForeign}
  );

  // Проверяем поля в порядке приоритета
  
  // 1. Основное краткое наименование
  if (counterpartyShort?.value) {
    return [counterpartyShort.value];
  }
  
  // 2. ФИО контрагента
  if (fullName?.value) {
    return [fullName.value];
  }
  
  // 3. Иностранное наименование
  if (counterpartyForeign?.value) {
    return [counterpartyForeign.value];
  }
  
  // Если все поля пустые
  return [''];
});


/*
* Дата создания: 23.12.2024
* Автор: Роман
* Краткое описание: Скрипт копирует значение из поля "Руководитель (Контрагент)" 
* в поле "u_counterpartymain_name_FIO_IP_" при любом изменении первого поля.
*/

form.onChange(['Руководитель (Контрагент)'], true)
  .setValues(['u_counterpartymain_name_FIO_IP_'], state => {
    const [manager] = state.changes;
    
    // Проверяем наличие значения в поле руководителя
    if (manager?.text) {
      return [manager.text];
    }
    
    // Если значение отсутствует
    return [null];
  });
