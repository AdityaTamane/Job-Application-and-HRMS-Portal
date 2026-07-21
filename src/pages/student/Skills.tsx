import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Award, Trophy, CheckCircle2, RotateCcw, X, ArrowRight } from 'lucide-react'
import { db } from '@/lib/db'
import { useStudent } from '@/hooks/useStudent'
import {
  quizzesForStudent,
  submitAssessment,
  tierInfo,
  careerPoints,
  type Quiz,
  type CareerTier,
} from '@/lib/assessments'
import type { AssessmentResult, Student } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/common/Icon'
import { EmptyState } from '@/components/ui/misc'
import { toast } from '@/components/ui/toast'
import { cn, formatDate } from '@/lib/utils'

const TIER_ICON: Record<CareerTier, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' }

export function Skills() {
  const student = useStudent()
  const results = useLiveQuery(
    () => (student ? db.assessments.where('studentId').equals(student.id).toArray() : []),
    [student?.id],
  )
  const [taking, setTaking] = useState<Quiz | null>(null)
  const [viewingCert, setViewingCert] = useState<{ quiz: Quiz; result: AssessmentResult } | null>(null)

  if (!student) return <EmptyState title="Loading your skill profile…" />

  const relevant = quizzesForStudent(student)
  const byQuiz = new Map((results ?? []).map((r) => [r.quizId, r]))

  return (
    <div>
      <PageHeader
        title="Skills & Certificates"
        subtitle="Prove your skills, earn verifiable certificates, and climb the career ladder"
      />

      <TierCard student={student} />

      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Assessments
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {relevant.map((quiz) => {
          const res = byQuiz.get(quiz.id)
          const passed = res?.passed
          return (
            <Card key={quiz.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                    passed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
                  )}
                >
                  <Icon name={quiz.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {quiz.questions.length} questions · pass {quiz.passScore}%
                  </p>
                </div>
                {passed && (
                  <Badge tone="green">
                    <CheckCircle2 className="h-3 w-3" /> {res!.score}%
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="blue">{quiz.skill}</Badge>
                {res && !res.passed && <Badge tone="amber">Best {res.score}%</Badge>}
              </div>

              <div className="mt-4 flex gap-2">
                {passed ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" icon={<Award className="h-4 w-4" />} onClick={() => setViewingCert({ quiz, result: res! })}>
                      View certificate
                    </Button>
                    <Button variant="ghost" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setTaking(quiz)}>
                      Retake
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => setTaking(quiz)}>
                    {res ? 'Try again' : 'Start assessment'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {taking && (
        <AssessmentRunner
          quiz={taking}
          student={student}
          onClose={() => setTaking(null)}
          onPassed={(quiz, result) => {
            setTaking(null)
            setViewingCert({ quiz, result })
          }}
        />
      )}
      {viewingCert && (
        <CertificateModal
          student={student}
          quiz={viewingCert.quiz}
          result={viewingCert.result}
          onClose={() => setViewingCert(null)}
        />
      )}
    </div>
  )
}

function TierCard({ student }: { student: Student }) {
  const info = tierInfo(student)
  const passedCount = student.certificateCount ?? 0
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl text-3xl shadow-inner"
            style={{ backgroundColor: `${info.color}22` }}
            aria-hidden
          >
            {TIER_ICON[info.tier]}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Career tier</p>
            <p className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              <Trophy className="h-5 w-5" style={{ color: info.color }} /> {info.tier}
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {careerPoints(student)} career points · {passedCount} certificate{passedCount !== 1 && 's'}
            </p>
          </div>
        </div>
        <div className="min-w-[200px] sm:text-right">
          {info.next ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{info.pointsToNext}</span> pts to{' '}
                <span className="font-semibold" style={{ color: info.color }}>{info.next.tier}</span>
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(info.progress * 100)}%`, backgroundColor: info.color }}
                />
              </div>
            </>
          ) : (
            <Badge tone="purple">Top tier reached 🏆</Badge>
          )}
        </div>
      </div>
    </Card>
  )
}

function AssessmentRunner({
  quiz,
  student,
  onClose,
  onPassed,
}: {
  quiz: Quiz
  student: Student
  onClose: () => void
  onPassed: (quiz: Quiz, result: AssessmentResult) => void
}) {
  const [answers, setAnswers] = useState<number[]>([])
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<AssessmentResult | null>(null)

  const q = quiz.questions[current]
  const isLast = current === quiz.questions.length - 1
  const answered = answers[current] !== undefined

  const choose = (i: number) => {
    const next = [...answers]
    next[current] = i
    setAnswers(next)
  }

  const submit = async () => {
    setSubmitting(true)
    const result = await submitAssessment(student, quiz, answers)
    setSubmitting(false)
    setDone(result)
    if (result.passed) toast.success('Assessment passed! Certificate issued 🎉')
    else toast.error(`Scored ${result.score}% — ${quiz.passScore}% needed to pass. Try again!`)
  }

  return (
    <Modal open onClose={onClose} title={quiz.title} size="lg">
      {done ? (
        <div className="text-center">
          <div
            className={cn(
              'mx-auto grid h-20 w-20 place-items-center rounded-full',
              done.passed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
            )}
          >
            {done.passed ? <Award className="h-10 w-10" /> : <X className="h-10 w-10" />}
          </div>
          <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{done.score}%</h3>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {done.correct}/{done.total} correct — {done.passed ? 'You passed!' : `${quiz.passScore}% needed to pass`}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {done.passed ? (
              <Button icon={<Award className="h-4 w-4" />} onClick={() => onPassed(quiz, done)}>
                View certificate
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setDone(null)
                  setAnswers([])
                  setCurrent(0)
                }}
              >
                Retry
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Question {current + 1} of {quiz.questions.length}</span>
            <span>{answers.filter((a) => a !== undefined).length} answered</span>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
          </div>

          <p className="text-base font-medium text-slate-900 dark:text-slate-100">{q.q}</p>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => choose(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition',
                  answers[current] === i
                    ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                )}
              >
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                    answers[current] === i ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 dark:border-slate-600',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              Back
            </Button>
            {isLast ? (
              <Button
                loading={submitting}
                disabled={answers.filter((a) => a !== undefined).length < quiz.questions.length}
                onClick={submit}
              >
                Submit
              </Button>
            ) : (
              <Button disabled={!answered} icon={<ArrowRight className="h-4 w-4" />} onClick={() => setCurrent((c) => c + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function CertificateModal({
  student,
  quiz,
  result,
  onClose,
}: {
  student: Student
  quiz: Quiz
  result: AssessmentResult
  onClose: () => void
}) {
  return (
    <Modal open onClose={onClose} title="Certificate of Achievement" size="lg">
      <div className="rounded-2xl border-2 border-beacon-300 bg-gradient-to-br from-brand-50 to-white p-8 text-center dark:from-slate-800 dark:to-slate-900 dark:border-beacon-500/40">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white">
          <Award className="h-7 w-7" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
          Lighthouse Academy Works
        </p>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">This certifies that</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">has successfully completed</p>
        <p className="mt-1 text-lg font-semibold text-brand-700 dark:text-brand-300">{quiz.title}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-emerald-600 shadow-sm dark:bg-slate-950">
          <CheckCircle2 className="h-4 w-4" /> Score {result.score}% · {quiz.skill}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
          <span>Issued {formatDate(result.takenAt)}</span>
          <span>ID: {result.id.toUpperCase()}</span>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.print()}>Print / Save PDF</Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  )
}
