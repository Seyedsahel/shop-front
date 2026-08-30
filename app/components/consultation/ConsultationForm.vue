<script setup lang="ts">
const consultationStore = useConsultationStore()
onMounted(() => consultationStore.fetchQuestions())

const errors = reactive<Record<string, string>>({})

function requiredValidator(q: ConsultationQuestion) {
  return (value: string) => (q.required && !value.trim()) ? 'این سوال الزامی است.' : ''
}

async function onSubmit() {
  const ok = await consultationStore.submit()
  if (ok) navigateTo('/profile')
}
</script>

<template>
  <div class="rounded-2xl border border-border-strong bg-surface p-6 mt-6">
    <h2 class="text-sm font-semibold text-text-primary mb-5">فرم درخواست مشاوره</h2>

    <form class="flex flex-col gap-5" @submit.prevent="onSubmit" novalidate>
      <template v-if="consultationStore.isLoading">
        <div v-for="n in 3" :key="n" class="h-12 rounded-xl bg-loading animate-pulse" />
      </template>

      <UiInput
        v-else
        v-for="question in consultationStore.questions"
        :key="question.id"
        v-model="consultationStore.answers[question.id]!"
        v-model:error="errors[question.id]"
        :label="question.required ? `${question.label} *` : question.label"
        :validate="requiredValidator(question)"
      />

      <UiTextarea
        v-model="consultationStore.description"
        label="شرح درخواست شما *"
        placeholder="مشکل یا سوال خود را با جزئیات بنویسید..."
        :rows="5"
        :validate="(v) => !v.trim() ? 'شرح درخواست الزامی است.' : ''"
      />

      <button
        type="submit"
        :disabled="consultationStore.isSubmitting"
        class="w-full sm:w-auto self-start bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground py-2 px-10 rounded-xl transition-colors"
      >
        {{ consultationStore.isSubmitting ? 'در حال ارسال...' : 'ارسال درخواست' }}
      </button>
    </form>
  </div>
</template>