/*
Скрипт для проверки, что к заполнено одно из полей
*/
form.onChange(['Линейный руководитель', 'Руководителя нет в Пайрус'], true)
  .validate('Руководителя нет в Пайрус', state => {
    const [contactField, checkboxField] = state.changes;

    const isContactFieldValid = contactField && contactField.person_id;

    const isCheckboxChecked = checkboxField && checkboxField.checked === true;

    if (!isContactFieldValid && !isCheckboxChecked) {
      return {
        errorMessage: 'Заполните хотя бы одно поле: выберите контакт или установите галочку'
      };
    }

    return null;
  });
