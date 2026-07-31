export interface ConsultationNoticeResponse {
    items: string[]
}

export interface ConsultationQuestion {
    id: string
    label: string
    required: boolean
}

export interface ConsultationQuestionsResponse {
    items: ConsultationQuestion[]
}

export interface ConsultationAnswer {
    questionId: string
    value: string
}

export interface SubmitConsultationPayload {
  answers: ConsultationAnswer[]
  description: string
}

export interface SubmitConsultationResponse {
  success: boolean
}