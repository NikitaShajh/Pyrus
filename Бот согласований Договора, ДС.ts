import { BotHookRequest, BotHookResponse, PyrusApiClient, ApprovalChoice } from "pyrus-api";

// Константы для настройки клиента
const BOT_LOGIN = "bot@1d270962-cc55-4108-9ff0-82f17550bf09";
const BOT_SECURITY_KEY = "n~-EcZH5dB94LOq3JT0SuFcUxMh5OXf9ZYG5kTrVLHXuNYexllEgBjrAPw8k~90FNX-TFNMGHnp9I9XEckNcaT0XyKFcUJTO";

// Константы для идентификаторов форм
const ID_FORM_CONTRACT = 1564293;
const ID_FORM_PAYMENT = 1564292;

// Константы для пороговых значений и фильтрации
const MIN_STAGE_VALUE = 0;
const TARGET_TASK_CURRENT_STEP = 1;
const PAYMENT_APPROVAL_STEP_THRESHOLD = 2;

// Прочие константы
const APPROVAL_COMMENT_TEXT = "Договор согласован";
const DOC_FIELD_CODE = "doc";

const client = new PyrusApiClient({
  login: BOT_LOGIN,
  security_key: BOT_SECURITY_KEY,
});

export default async function handleContractEvent({ task }: BotHookRequest): Promise<BotHookResponse> {
  switch (task.form_id) {
    case ID_FORM_CONTRACT:
      return await handleFormATask(task);
    case ID_FORM_PAYMENT:
      // Заглушка для FORM_B_ID (временная реализация)
      return await handleFormBTaskStub(task);
    default:
      return {};
  }
}

async function handleFormATask(task: any): Promise<BotHookResponse> {
  const { comments, linked_task_ids: linkedTaskIds } = task;
  const stage = comments[0]?.changed_step ?? MIN_STAGE_VALUE;
  if (stage <= MIN_STAGE_VALUE) {
    return {};
  }

  const tasksData = await Promise.all(
    linkedTaskIds.map((id: number) => client.tasks.get({ id }))
  );

  const filteredTaskIds = tasksData
    .filter(item => item.task.form_id === ID_FORM_PAYMENT && item.task.current_step === TARGET_TASK_CURRENT_STEP)
    .map(item => item.task.id);

  const formList = await Promise.all(
    filteredTaskIds.map(id => client.tasks.get({ id }))
  );
  console.log("Filtered tasks data:", formList);

  for (const id of filteredTaskIds) {
    await client.tasks.addComment(id, {
      approval_choice: ApprovalChoice.Approved,
      text: APPROVAL_COMMENT_TEXT,
    });
  }
  return {};
}

async function handleFormBTaskStub(task: any): Promise<BotHookResponse> {
  const fieldWithDoc = task.fields.find(field => field.code === DOC_FIELD_CODE);
  const taskId = fieldWithDoc?.value?.task_id;
  console.log(taskId);

  const formCheck = await client.tasks.get({ id: taskId });
  const step = formCheck.task.current_step;

  if (step >= PAYMENT_APPROVAL_STEP_THRESHOLD) {
    await client.tasks.addComment(task.id, {
      approval_choice: ApprovalChoice.Approved,
      text: APPROVAL_COMMENT_TEXT,
    });
  }
  return {};
}
