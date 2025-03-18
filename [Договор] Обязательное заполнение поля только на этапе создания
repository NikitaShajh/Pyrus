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
