<template>
  <nav class="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
    <div class="hover:underline text-xl font-bold" @click="router.push('/')">MySite</div>
    <ul class="flex flex-row items-center justify-end gap-6">
      <li><NuxtLink to="/tools" class="hover:underline">Tools</NuxtLink></li>
    </ul>
  </nav>
</template>
<script setup>
  const router = useRouter()
</script>
