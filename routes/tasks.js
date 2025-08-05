const express = require('express');
const router = express.Router();
const knex = require('../knex'); 

// タスク一覧取得（GET /tasks）
router.get('/', async (req, res) => {
  try {
    const tasks = await knex('tasks_calender').select('*');

    const events = tasks.map(task => {
      let duration = null;

      // 勉強時間を計算（両方あれば）
      if (task.study_start && task.study_end) {
        const start = new Date(task.study_start);
        const end = new Date(task.study_end);
        const diffMs = end - start;
        duration = diffMs / (1000 * 60 * 60); // 時間（h）
      }

      return {
        id: task.id,
        title: task.title,
        start: task.start,
        allDay: true,
        color: task.is_study ? 'green' : 'blue',
        is_study: !!task.is_study,
        study_start: task.study_start,
        study_end: task.study_end,
        study_duration: duration
      };
    });

    res.json(events);
  } catch (err) {
    console.error('タスク取得エラー:', err);
    res.status(500).json({ error: 'タスク取得に失敗しました' });
  }
});

// タスク追加（POST /tasks）
router.post('/', async (req, res) => {
  const { title, start, is_study } = req.body;

  if (!title || !start) return res.status(400).send('不正な入力');

  try {
    await knex('tasks_calender').insert({
      title,
      start,
      end: start,
      is_study: is_study ? 1 : 0
    });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// PUT /tasks/:id の例（Knex使用）
router.put('/:id', async (req, res) => {
  const { title, start, end } = req.body;
  try {
    await knex('tasks_calender').where('id', req.params.id).update({
      title, start, end
    });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});



// タスク削除（DELETE /tasks/:id）
router.delete('/:id', async (req, res) => {
  try {
    await knex('tasks_calender').where('id', req.params.id).del();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// 勉強開始記録
router.post('/:id/start', async (req, res) => {
  const id = req.params.id;
  const startTime = new Date();
  await knex('tasks_calender')
    .where({ id })
    .update({ study_start: startTime });
  res.sendStatus(200);
});

// 勉強終了記録と勉強時間計算
router.post('/:id/end', async (req, res) => {
  const id = req.params.id;
  const endTime = new Date();

  const task = await knex('tasks_calender').where({ id }).first();
  if (!task.study_start) return res.status(400).send('開始していません');

  const durationMs = new Date(endTime) - new Date(task.study_start);
  const durationHours = durationMs / 1000 / 60 / 60;

  await knex('tasks_calender')
    .where({ id })
    .update({
      study_end: endTime,
      study_duration: durationHours
    });

res.json({
  study_end: endTime.toISOString(),
  duration: durationHours
});
});

module.exports = router;
