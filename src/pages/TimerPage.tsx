import { Button, Card, Slider, Space, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BreathingLightBackground } from '../components/BreathingLightBackground';

const PRESET_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 5];
const MIN_SPEED = 0.1;
const MAX_SPEED = 8;

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
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [realDeltaMs, setRealDeltaMs] = useState(0);

  const rafIdRef = useRef<number | null>(null);
  const simAnchorRealRef = useRef<number | null>(null);
  const simAnchorElapsedRef = useRef(0);
  const runRealStartRef = useRef<number | null>(null);
  const speedRef = useRef(speed);

  const viewModel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);

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
      setElapsedMs(computeCurrentElapsed(now));
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

    const now = performance.now();
    simAnchorRealRef.current = now;
    simAnchorElapsedRef.current = elapsedMs;
    runRealStartRef.current = now;
    setIsRunning(true);
  };

  const onPause = () => {
    if (!isRunning) return;
    const now = performance.now();
    const frozen = computeCurrentElapsed(now);
    const realDelta =
      runRealStartRef.current === null ? 0 : Math.max(0, now - runRealStartRef.current);
    simAnchorElapsedRef.current = frozen;
    simAnchorRealRef.current = null;
    runRealStartRef.current = null;
    setElapsedMs(frozen);
    setRealDeltaMs(realDelta);
    setIsRunning(false);
  };

  const onReset = () => {
    cancelAnimation();
    setIsRunning(false);
    setElapsedMs(0);
    setRealDeltaMs(0);
    simAnchorRealRef.current = null;
    simAnchorElapsedRef.current = 0;
    runRealStartRef.current = null;
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
          <Typography.Text className="timer-title block text-xs tracking-[0.28em] text-slate-400">
            秒表
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
