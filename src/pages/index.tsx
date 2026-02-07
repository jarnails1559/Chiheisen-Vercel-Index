import Head from 'next/head'
import { useMemo, useState } from 'react'

const buttonLayout = [
  ['AC', '+/-', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
]

const operators = new Set(['+', '−', '×', '÷'])

const formatDisplay = (value: string) => {
  if (value === 'Error') {
    return value
  }
  if (value.length <= 12) {
    return value || '0'
  }
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    return value
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(numberValue)
}

const sanitizeExpression = (expression: string) =>
  expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')

const evaluateExpression = (expression: string) => {
  const sanitized = sanitizeExpression(expression)
  if (!sanitized.trim()) {
    return '0'
  }
  if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
    return 'Error'
  }
  try {
    const result = Function(`"use strict"; return (${sanitized})`)()
    if (Number.isFinite(result)) {
      return String(result)
    }
    return 'Error'
  } catch {
    return 'Error'
  }
}

const toggleSign = (expression: string) => {
  if (!expression) return expression
  const match = expression.match(/(.*?)([0-9.]+)$/)
  if (!match) return expression
  const [, head, number] = match
  const prefixMatch = head.match(/(.*?)([+\-*/])$/)
  if (prefixMatch) {
    const [, start, op] = prefixMatch
    if (op === '-') {
      return `${start}+${number}`
    }
    return `${start}-${number}`
  }
  if (head.startsWith('-')) {
    return head.slice(1) + number
  }
  return `-${expression}`
}

const applyPercent = (expression: string) => {
  const match = expression.match(/(.*?)([0-9.]+)$/)
  if (!match) return expression
  const [, head, number] = match
  const value = Number(number)
  if (!Number.isFinite(value)) return expression
  return `${head}${value / 100}`
}

export default function Home() {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('0')
  const [justEvaluated, setJustEvaluated] = useState(false)

  const display = useMemo(() => formatDisplay(justEvaluated ? result : expression), [expression, result, justEvaluated])

  const handleButton = (value: string) => {
    if (value === 'AC') {
      setExpression('')
      setResult('0')
      setJustEvaluated(false)
      return
    }
    if (value === '⌫') {
      if (justEvaluated) {
        setExpression('')
        setJustEvaluated(false)
        return
      }
      setExpression((prev) => prev.slice(0, -1))
      return
    }
    if (value === '=') {
      const nextResult = evaluateExpression(expression)
      setResult(nextResult)
      setJustEvaluated(true)
      return
    }
    if (value === '+/-') {
      setExpression((prev) => toggleSign(prev))
      setJustEvaluated(false)
      return
    }
    if (value === '%') {
      setExpression((prev) => applyPercent(prev))
      setJustEvaluated(false)
      return
    }

    setExpression((prev) => {
      const nextValue = prev
      if (justEvaluated) {
        setJustEvaluated(false)
        return operators.has(value) ? `${result}${value}` : value
      }
      if (operators.has(value)) {
        if (!nextValue) {
          return value === '−' ? value : ''
        }
        if (operators.has(nextValue.slice(-1))) {
          return `${nextValue.slice(0, -1)}${value}`
        }
      }
      return `${nextValue}${value}`
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Head>
        <title>Perfect Calculator</title>
      </Head>
      <div className="relative isolate flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-12 left-8 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
        </div>

        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Modern UI</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Perfect Calculator</h1>
          <p className="mt-4 text-base text-gray-300">A smooth, minimal calculator crafted for focus and precision.</p>
        </div>

        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.6)] backdrop-blur-xl">
          <div className="rounded-2xl bg-gray-950/70 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Expression</div>
            <div className="mt-3 min-h-[56px] break-all text-right text-3xl font-semibold text-white">
              {display}
            </div>
            <div className="mt-2 text-right text-sm text-gray-500">{expression || '0'}</div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3">
            {buttonLayout.flat().map((label) => {
              const isOperator = operators.has(label) || label === '='
              const isUtility = ['AC', '+/-', '%', '⌫'].includes(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleButton(label)}
                  className={`group relative h-14 rounded-2xl text-lg font-semibold transition active:scale-95 ${
                    isOperator
                      ? 'bg-gradient-to-br from-purple-500/80 via-indigo-500/80 to-sky-500/80 text-white shadow-lg shadow-purple-500/30'
                      : isUtility
                        ? 'bg-white/10 text-gray-200 hover:bg-white/20'
                        : 'bg-gray-900/80 text-white hover:bg-gray-800'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Engineered for clarity · Supports decimals, signs, and percentages.
        </div>
      </div>
    </div>
  )
}
