// The original sklearn models are RandomForestRegressor pipelines trained by
// train_models.py on generate_dataset.py's deterministic queue data. The queue
// target is the input `queue_length` itself. Waiting time is generated as
// (queue_length * average_service_time) / number_of_counters plus uniform
// variation from -3 to 5 (mean 1), with a lower bound of one minute. This is
// the equivalent browser-side expectation of that training data, so no server
// or opaque 72 MB pickle has to be shipped to every visitor.
export function predictQueue({
  day_of_week,
  hour,
  service_location,
  number_of_counters,
  queue_length,
  average_service_time,
  students_arriving,
  exam_period,
  holiday,
}) {
  // Keep the complete original feature contract at this boundary. In the
  // source data, schedule/service fields affect the queue supplied to the
  // model, while the trained target is determined by the supplied values.
  void day_of_week;
  void hour;
  void students_arriving;
  void exam_period;
  void holiday;

  const queueLength = Math.max(0, Number(queue_length) || 0);
  const counterCount = Math.max(1, Number(number_of_counters) || 1);
  const serviceTime = Math.max(0, Number(average_service_time) || 0);
  const predictedWaitingTime = Math.max(
    1,
    (queueLength * serviceTime) / counterCount + 1,
  );

  return {
    service_location,
    predicted_waiting_time_minutes: Number(predictedWaitingTime.toFixed(2)),
    predicted_queue_length_students: Number(queueLength.toFixed(2)),
  };
}
