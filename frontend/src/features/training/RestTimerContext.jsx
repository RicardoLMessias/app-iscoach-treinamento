import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TimerReset, Volume2, X } from "lucide-react";
import { RestTimerContext, useRestTimer } from "./restTimerStore.js";
import styles from "./RestTimerContext.module.css";

const STORAGE_PREFIX = "is-coach:rest-timer";
const ALARM_PREFIX = "is-coach:rest-alarm";
const DEFAULT_ALARM = { volume: 90, repeats: 3 };

function readStoredAlarm(storageKey) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    return {
      volume: Number.isInteger(stored?.volume) ? Math.max(0, Math.min(100, stored.volume)) : DEFAULT_ALARM.volume,
      repeats: [1, 3, 5].includes(stored?.repeats) ? stored.repeats : DEFAULT_ALARM.repeats,
    };
  } catch {
    return DEFAULT_ALARM;
  }
}

function readStoredTimer(storageKey) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    if (!stored?.endsAt || Number(stored.endsAt) <= Date.now()) return null;
    return { endsAt: Number(stored.endsAt), duration: Number(stored.duration) || 0, exerciseName: stored.exerciseName || "" };
  } catch {
    return null;
  }
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function RestTimerProvider({ children, userId }) {
  const storageKey = `${STORAGE_PREFIX}:${userId}`;
  const alarmStorageKey = `${ALARM_PREFIX}:${userId}`;
  const initialTimer = useMemo(() => readStoredTimer(storageKey), [storageKey]);
  const [timer, setTimer] = useState(initialTimer);
  const [remaining, setRemaining] = useState(() => initialTimer ? Math.max(0, Math.ceil((initialTimer.endsAt - Date.now()) / 1000)) : 0);
  const [finished, setFinished] = useState(false);
  const [alarmSettings, setAlarmSettings] = useState(() => readStoredAlarm(alarmStorageKey));
  const audioContextRef = useRef(null);
  const alarmFiredRef = useRef(false);

  const prepareAlarm = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
    if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume().catch(() => {});
    return audioContextRef.current;
  }, []);

  const playAlarm = useCallback(async () => {
    const vibration = Array.from({ length: alarmSettings.repeats }, (_, index) => index === alarmSettings.repeats - 1 ? [240] : [240, 130]).flat();
    window.navigator.vibrate?.(vibration);
    const context = await prepareAlarm();
    if (!context || context.state !== "running") return;

    Array.from({ length: alarmSettings.repeats }, (_, index) => index * 0.38).forEach((offset) => {
      const startsAt = context.currentTime + offset;
      const volume = alarmSettings.volume / 100;
      [["square", 880, 0.58], ["sine", 1320, 0.22]].forEach(([wave, frequency, level]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, startsAt);
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * volume), startsAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.29);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + 0.3);
      });
    });
  }, [alarmSettings, prepareAlarm]);

  const updateAlarmSettings = useCallback((changes) => {
    setAlarmSettings((current) => {
      const next = { ...current, ...changes };
      window.localStorage.setItem(alarmStorageKey, JSON.stringify(next));
      return next;
    });
  }, [alarmStorageKey]);

  const reset = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    alarmFiredRef.current = false;
    setTimer(null);
    setRemaining(0);
    setFinished(false);
  }, [storageKey]);

  const start = useCallback((seconds, exerciseName = "") => {
    const duration = Math.max(0, Number(seconds) || 0);
    if (duration === 0) {
      reset();
      return;
    }
    const nextTimer = { endsAt: Date.now() + (duration * 1000), duration, exerciseName };
    prepareAlarm();
    window.localStorage.setItem(storageKey, JSON.stringify(nextTimer));
    alarmFiredRef.current = false;
    setFinished(false);
    setTimer(nextTimer);
    setRemaining(duration);
  }, [prepareAlarm, reset, storageKey]);

  useEffect(() => {
    if (!timer?.endsAt) return undefined;
    const updateRemaining = () => {
      const nextRemaining = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
      setRemaining(nextRemaining);
      if (nextRemaining === 0 && !alarmFiredRef.current) {
        alarmFiredRef.current = true;
        window.localStorage.removeItem(storageKey);
        setTimer(null);
        setFinished(true);
        playAlarm();
      }
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(interval);
  }, [playAlarm, storageKey, timer?.endsAt]);

  useEffect(() => {
    if (!finished) return undefined;
    const timeout = window.setTimeout(() => setFinished(false), 6000);
    return () => window.clearTimeout(timeout);
  }, [finished]);

  const value = useMemo(() => ({
    alarmSettings,
    exerciseName: timer?.exerciseName || "",
    finished,
    prepareAlarm,
    remaining,
    reset,
    running: Boolean(timer?.endsAt && remaining > 0),
    start,
    testAlarm: playAlarm,
    updateAlarmSettings,
  }), [alarmSettings, finished, playAlarm, prepareAlarm, remaining, reset, start, timer?.endsAt, timer?.exerciseName, updateAlarmSettings]);

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>;
}

export function RestAlarmSettings() {
  const { alarmSettings, testAlarm, updateAlarmSettings } = useRestTimer();

  return (
    <section className={`${styles.settings} surface-card`}>
      <h2>Som do descanso</h2>
      <label htmlFor="rest-alarm-volume">Volume do aviso: {alarmSettings.volume}%</label>
      <input id="rest-alarm-volume" type="range" min="0" max="100" step="10" value={alarmSettings.volume} onChange={(event) => updateAlarmSettings({ volume: Number(event.target.value) })} />
      <label htmlFor="rest-alarm-repeats">Quantidade de toques</label>
      <select id="rest-alarm-repeats" value={alarmSettings.repeats} onChange={(event) => updateAlarmSettings({ repeats: Number(event.target.value) })}>
        <option value="1">1 toque</option><option value="3">3 toques</option><option value="5">5 toques</option>
      </select>
      <button type="button" onClick={testAlarm}>Testar som</button>
      <small>O volume também depende das configurações de som do celular e do navegador.</small>
    </section>
  );
}

export function GlobalRestTimer() {
  const { exerciseName, finished, remaining, reset, running } = useRestTimer();
  if (!running && !finished) return null;

  return (
    <aside className={`${styles.timer} ${finished ? styles.finished : ""}`} role={finished ? "alert" : "timer"} aria-live="polite">
      <span className={styles.icon}>{finished ? <Volume2 size={19} /> : <TimerReset size={20} />}</span>
      <span className={styles.copy}>
        <small>{finished ? "Descanso concluído" : "Descanso"}</small>
        <strong>{finished ? "Hora da próxima série" : formatTime(remaining)}</strong>
        {!finished && exerciseName && <span title={exerciseName}>{exerciseName}</span>}
      </span>
      <button type="button" onClick={reset} aria-label={finished ? "Fechar aviso" : "Zerar cronômetro"}><X size={18} /></button>
    </aside>
  );
}
