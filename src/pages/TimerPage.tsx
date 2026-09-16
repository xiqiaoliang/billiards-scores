import { Button, Card, InputNumber, Segmented, Slider, Space, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BreathingLightBackground } from '../components/BreathingLightBackground';

const PRESET_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 5];
const COUNTDOWN_PRESETS = [10, 30, 60, 120, 300];
const MIN_SPEED = 0.1;
const MAX_SPEED = 8;
const MIN_COUNTDOWN_SECONDS = 1;
const MAX_COUNTDOWN_SECONDS = 359999;

function getInitialSpeedFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  let raw = searchParams.get('speed');

  if (!raw && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    const hashParams = new URLSearchParams(hashQuery);
    raw = hashParams.get('speed');
  }

  if (!raw) {
    return 1;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, parsed));
}

function formatTime(elapsedMs: number) {
  const safeElapsed = Math.max(0, Math.floor(elapsedMs));
  const seconds = Math.floor(safeElapsed / 1000);
  const milliseconds = safeElapsed % 1000;

  return {
    secondsText: String(seconds),
    millisecondsText: String(milliseconds).padStart(3, '0'),
  };
}

export default function TimerPage() {
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('countdown');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speed, setSpeed] = useState(() => getInitialSpeedFromUrl());
  const [realDeltaMs, setRealDeltaMs] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(60);

  const rafIdRef = useRef<number | null>(null);
  const simAnchorRealRef = useRef<number | null>(null);
  const simAnchorElapsedRef = useRef(0);
  const segmentRealStartRef = useRef<number | null>(null);
  const accumulatedRealMsRef = useRef(0);
  const speedRef = useRef(speed);
  const modeRef = useRef(mode);
  const countdownTargetRef = useRef(countdownSeconds * 1000);

  const countdownTargetMs = useMemo(() => countdownSeconds * 1000, [countdownSeconds]);
  const displayMs = useMemo(() => {
    if (mode === 'countdown') {
      return Math.max(0, countdownTargetMs - elapsedMs);
    }
    return elapsedMs;
  }, [countdownTargetMs, elapsedMs, mode]);

  const viewModel = useMemo(() => formatTime(displayMs), [displayMs]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '计时器';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const cancelAnimation = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const computeCurrentElapsed = (now: number) => {
    if (simAnchorRealRef.current === null) {
      return simAnchorElapsedRef.current;
    }

    return simAnchorElapsedRef.current + (now - simAnchorRealRef.current) * speedRef.current;
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    countdownTargetRef.current = countdownTargetMs;

    if (!isRunning && modeRef.current === 'countdown' && elapsedMs > countdownTargetMs) {
      setElapsedMs(countdownTargetMs);
      simAnchorElapsedRef.current = countdownTargetMs;
    }
  }, [countdownTargetMs, elapsedMs, isRunning]);

  useEffect(() => {
    if (isRunning && simAnchorRealRef.current !== null) {
      const now = performance.now();
      const progressed = computeCurrentElapsed(now);
      simAnchorElapsedRef.current = progressed;
      simAnchorRealRef.current = now;
      setElapsedMs(progressed);
    }

    speedRef.current = speed;
  }, [speed, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimation();
      return;
    }

    const tick = (now: number) => {
      const progressed = computeCurrentElapsed(now);
      if (modeRef.current === 'countdown') {
        const target = countdownTargetRef.current;
        if (progressed >= target) {
          const segmentRealDelta =
            segmentRealStartRef.current === null
              ? 0
              : Math.max(0, now - segmentRealStartRef.current);
          const nextAccumulatedReal = accumulatedRealMsRef.current + segmentRealDelta;
          accumulatedRealMsRef.current = nextAccumulatedReal;

          simAnchorElapsedRef.current = target;
          simAnchorRealRef.current = null;
          segmentRealStartRef.current = null;
          setElapsedMs(target);
          setRealDeltaMs(nextAccumulatedReal);
          setIsRunning(false);
          return;
        }
      }

      setElapsedMs(progressed);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimation();
    };
  }, [isRunning]);

  useEffect(
    () => () => {
      cancelAnimation();
    },
    [],
  );

  const onStart = () => {
    if (isRunning) return;

    if (mode === 'countdown') {
      if (countdownTargetMs <= 0) {
        return;
      }
      if (elapsedMs >= countdownTargetMs) {
        setElapsedMs(0);
        simAnchorElapsedRef.current = 0;
        setRealDeltaMs(0);
        accumulatedRealMsRef.current = 0;
      }
    }

    const now = performance.now();
    simAnchorRealRef.current = now;
    simAnchorElapsedRef.current =
      mode === 'countdown' && elapsedMs >= countdownTargetMs ? 0 : elapsedMs;
    segmentRealStartRef.current = now;
    setIsRunning(true);
  };

  const onPause = () => {
    if (!isRunning) return;
    const now = performance.now();
    const frozen = computeCurrentElapsed(now);
    const segmentRealDelta =
      segmentRealStartRef.current === null ? 0 : Math.max(0, now - segmentRealStartRef.current);
    const nextAccumulatedReal = accumulatedRealMsRef.current + segmentRealDelta;
    accumulatedRealMsRef.current = nextAccumulatedReal;

    simAnchorElapsedRef.current = frozen;
    simAnchorRealRef.current = null;
    segmentRealStartRef.current = null;
    setElapsedMs(frozen);
    setRealDeltaMs(nextAccumulatedReal);
    setIsRunning(false);
  };

  const onReset = () => {
    cancelAnimation();
    setIsRunning(false);
    setElapsedMs(0);
    setRealDeltaMs(0);
    simAnchorRealRef.current = null;
    simAnchorElapsedRef.current = 0;
    segmentRealStartRef.current = null;
    accumulatedRealMsRef.current = 0;
  };

  return (
    <div className="timer-screen timer-screen-dark relative min-h-dvh overflow-hidden px-4 py-5 text-slate-100">
      <BreathingLightBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(8,47,73,0.08),rgba(2,6,23,0.75))]" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4">
        <Card
          className="timer-card timer-card-dark timer-shell-card border-0"
          bodyStyle={{ padding: 20 }}
        >
          <div className="mb-3 flex justify-center">
            <Segmented
              value={mode}
              onChange={(value) => {
                const nextMode = value as 'stopwatch' | 'countdown';
                if (isRunning) {
                  onPause();
                }
                setMode(nextMode);
                setElapsedMs(0);
                setRealDeltaMs(0);
                simAnchorElapsedRef.current = 0;
                simAnchorRealRef.current = null;
                segmentRealStartRef.current = null;
                accumulatedRealMsRef.current = 0;
              }}
              options={[
                { label: '正计时', value: 'stopwatch' },
                { label: '倒计时', value: 'countdown' },
              ]}
            />
          </div>

          {mode === 'countdown' && (
            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-slate-600/55 bg-slate-900/40 p-3">
              <Typography.Text className="text-xs text-slate-300">倒计时秒数</Typography.Text>
              <div className="flex items-center gap-2">
                <InputNumber
                  className="timer-countdown-input"
                  min={MIN_COUNTDOWN_SECONDS}
                  max={MAX_COUNTDOWN_SECONDS}
                  step={1}
                  value={countdownSeconds}
                  controls
                  disabled={isRunning}
                  onChange={(value) => {
                    if (value === null) return;
                    const next = Math.min(
                      MAX_COUNTDOWN_SECONDS,
                      Math.max(MIN_COUNTDOWN_SECONDS, Math.floor(value)),
                    );
                    setCountdownSeconds(next);
                  }}
                />
                <Typography.Text className="text-xs text-slate-400">秒</Typography.Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {COUNTDOWN_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    className="timer-preset-btn"
                    type={countdownSeconds === preset ? 'primary' : 'default'}
                    disabled={isRunning}
                    onClick={() => setCountdownSeconds(preset)}
                  >
                    {preset}s
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Typography.Text className="timer-title block text-xs tracking-[0.28em] text-slate-400">
            {mode === 'countdown' ? '倒计时' : '秒表'}
          </Typography.Text>
          <div className="timer-display timer-display-dark mt-3 flex items-end justify-center gap-2 rounded-2xl px-3 py-8">
            <span className="timer-seconds text-[60px] leading-none text-slate-50">
              {viewModel.secondsText}
            </span>
            <span className="timer-dot pb-1 text-[44px] leading-none text-cyan-100/75">.</span>
            <span className="timer-millis pb-1 text-[38px] leading-none text-cyan-100">
              {viewModel.millisecondsText}
            </span>
          </div>
          <Typography.Text className="mt-3 block text-center text-xs text-slate-400">
            显示格式：秒.毫秒（秒数可持续累加，不按分钟进位）
          </Typography.Text>
          <Typography.Text className="mt-1 block text-center text-xs text-slate-400">
            实际时间增量（暂停时更新）：+{(realDeltaMs / 1000).toFixed(3)}s
          </Typography.Text>

          <Space className="mt-5 flex justify-center" size={12} wrap>
            <Button
              type={isRunning ? 'default' : 'primary'}
              size="large"
              onClick={onStart}
              disabled={isRunning}
              className="timer-start-btn"
            >
              开始
            </Button>
            <Button size="large" onClick={onPause} disabled={!isRunning} className="timer-pause-btn">
              暂停
            </Button>
            <Button size="large" danger onClick={onReset} className="timer-reset-btn">
              清零
            </Button>
          </Space>
        </Card>

        <Card className="timer-card-dark timer-shell-card border-0" bodyStyle={{ padding: 18 }}>
          <div className="mb-2 flex items-center justify-between">
            <Typography.Title level={5} className="!mb-0 !text-[16px] !text-slate-100">
              时间流速
            </Typography.Title>
            <Typography.Text strong className="text-cyan-300">
              {speed.toFixed(2)}x
            </Typography.Text>
          </div>

          <Slider
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={0.05}
            value={speed}
            onChange={(value) => setSpeed(value)}
            tooltip={{ formatter: (value) => `${Number(value).toFixed(2)}x` }}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_SPEEDS.map((preset) => (
              <Button
                key={preset}
                size="small"
                className="timer-preset-btn"
                type={Math.abs(speed - preset) < 0.001 ? 'primary' : 'default'}
                onClick={() => setSpeed(preset)}
              >
                {preset}x
              </Button>
            ))}
          </div>

          <Typography.Paragraph className="!mt-3 !mb-0 text-xs text-slate-400">
            1x 时，计时器 1 秒对应现实 1 秒。小于 1x 为慢放，大于 1x 为加速。
          </Typography.Paragraph>
        </Card>
      </div>
    </div>
  );
}
