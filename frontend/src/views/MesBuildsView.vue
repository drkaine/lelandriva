<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SheetBuild from '@/components/composants/SheetBuild.vue'
import { useBuildStore } from '@/stores/buildStore'
import { useConnexionStore } from '@/stores/connexionStore'
import type { BuildData } from '@/types/build'

const buildStore = useBuildStore()
const route = useRoute()
const builds = ref<BuildData[]>([])
const urlApiSave = import.meta.env.VITE_URL_API_SAVE
const connexionStore = useConnexionStore()
const isLelarivaBuildPage = computed(() =>
  route.path.endsWith('/Lebuildarriva'),
)
const selectedRoles = ref(new Set<string>())
const searchType = ref('all')
const searchQuery = ref('')
const visibilityFilter = ref('all')

onMounted(async () => {
  try {
    const url = isLelarivaBuildPage.value
      ? `${urlApiSave}/api/builds/lelariva`
      : `${urlApiSave}/api/builds`

    const response = await fetch(url)
    const data = await response.json()
    builds.value = data
  } catch (error) {
    console.error('Erreur lors du chargement des builds:', error)
    builds.value = []
  }
})

const toggleRole = (role: string) => {
  if (selectedRoles.value.has(role)) {
    selectedRoles.value.delete(role)
  } else {
    selectedRoles.value.add(role)
  }
}

const searchPlaceholder = computed(() => {
  switch (searchType.value) {
    case 'name':
      return 'Rechercher par nom de build...'
    case 'champion':
      return 'Rechercher par champion...'
    default:
      return 'Rechercher un build...'
  }
})

const filteredBuilds = computed(() => {
  let filtered = isLelarivaBuildPage.value
    ? connexionStore.isLoggedIn
      ? builds.value
      : builds.value.filter(build => !build.id?.startsWith('wait_'))
    : buildStore.userBuilds

  if (isLelarivaBuildPage.value && connexionStore.isLoggedIn) {
    switch (visibilityFilter.value) {
      case 'visible':
        filtered = filtered.filter(build => !build.id?.startsWith('wait_'))
        break
      case 'hidden':
        filtered = filtered.filter(build => build.id?.startsWith('wait_'))
        break
    }
  }

  if (selectedRoles.value.size > 0) {
    filtered = filtered.filter(build =>
      build.roles.some(role => selectedRoles.value.has(role)),
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(build => {
      switch (searchType.value) {
        case 'name':
          return build.name.toLowerCase().includes(query)
        case 'champion':
          return build.sheet.champion.name.toLowerCase().includes(query)
        default:
          return (
            build.name.toLowerCase().includes(query) ||
            build.sheet.champion.name.toLowerCase().includes(query)
          )
      }
    })
  }

  return filtered
})

const handleDragStart = (e: DragEvent, index: number) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }
}

const handleDrop = (e: DragEvent, dropIndex: number) => {
  e.preventDefault()
  const dragIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1')
  if (dragIndex !== -1 && dragIndex !== dropIndex) {
    const builds = [...filteredBuilds.value]
    const [movedBuild] = builds.splice(dragIndex, 1)
    builds.splice(dropIndex, 0, movedBuild)
    buildStore.updateBuildsOrder(builds)
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const canDragBuild = computed(
  () => !isLelarivaBuildPage.value || connexionStore.isLoggedIn,
)
</script>

<template>
  <div class="builds-page">
    <h1 class="page-title">
      {{ isLelarivaBuildPage ? 'Builds de Lelariva' : 'Mes builds' }}
    </h1>

    <div class="actions">
      <div class="actions-group">
        <a href="/build" class="btn create-btn">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M12 5v14m-7-7h14" />
          </svg>
          <span class="btn-text">Nouveau Build</span>
        </a>

        <select
          v-if="isLelarivaBuildPage && connexionStore.isLoggedIn"
          v-model="visibilityFilter"
          class="visibility-select"
        >
          <option value="all">Tous les builds</option>
          <option value="visible">Builds visibles</option>
          <option value="hidden">Builds invisibles</option>
        </select>

        <div class="search-box">
          <select v-model="searchType" class="search-type-select">
            <option value="all">Tout</option>
            <option value="name">Nom</option>
            <option value="champion">Champion</option>
          </select>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="search-input"
          />
        </div>
      </div>
    </div>

    <div class="role-filters">
      <button
        v-for="role in ['top', 'jungle', 'mid', 'bot', 'support']"
        :key="role"
        class="role-btn"
        :class="{ 'role-inactive': !selectedRoles.has(role) }"
        @click="toggleRole(role)"
      >
        <img :src="`/assets/icons/roles/${role}.png`" :alt="role" />
        <span class="role-text">{{ role }}</span>
      </button>
    </div>

    <div class="builds-grid">
      <div
        v-for="(build, index) in filteredBuilds"
        :key="build.id"
        class="build-card"
        :draggable="canDragBuild"
        @dragstart="canDragBuild && handleDragStart($event, index)"
        @drop="canDragBuild && handleDrop($event, index)"
        @dragover="canDragBuild && handleDragOver($event)"
        :class="{ 'no-drag': !canDragBuild }"
      >
        <div
          v-if="isLelarivaBuildPage && connexionStore.isLoggedIn"
          class="visibility-badge"
          :class="{ 'is-hidden': build.id?.startsWith('wait_') }"
        >
          {{ build.id?.startsWith('wait_') ? 'Invisible' : 'Visible' }}
        </div>
        <a :href="`/build/${build.id}`" class="build-link">
          <SheetBuild
            :version="build.version"
            :name="build.name"
            :description="build.description"
            :champion="build.sheet.champion"
            :runes="build.sheet.runes"
            :summoners="build.sheet.summoners"
            :shards="build.sheet.shards"
            :items="build.sheet.items"
            :roles="build.roles ?? null"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.builds-page {
  max-width: 1400px;
}

.page-title {
  color: var(--gold-lol);
  font-size: 2rem;
  margin: 0 0 2rem 0;
  text-align: center;
}

.btn-text {
  @media (max-width: 768px) {
    display: none;
  }
}

.role-text {
  @media (max-width: 768px) {
    display: none;
  }
}

.role-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border: 2px solid var(--gold-lol);
  border-radius: 4px;
  color: var(--gold-lol);
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-btn img {
  width: 20px;
  height: 20px;
}

.role-btn.role-inactive {
  border-color: var(--slate-3);
  color: var(--slate-3);
  opacity: 0.7;
}

.role-btn:hover {
  border-color: var(--gold-lol);
  color: var(--gold-lol);
  opacity: 1;
}

.actions {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.actions-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  max-width: 800px;
  width: 100%;
  justify-content: center;
}

.search-box {
  display: flex;
  border: 2px solid var(--slate-3);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  width: 300px;
}

.search-box option {
  color: var(--nox-gold4);
  background: black;
}

.visibility-select {
  background: none;
  height: 100%;
  color: var(--nox-grey2);
  border: 2px solid var(--nox-gold4);
}

.visibility-select option {
  color: var(--nox-gold4);
  background: black;
}

.search-type-select {
  padding: 0.4rem;
  border: none;
  border-right: 2px solid var(--slate-3);
  background: none;
  color: var(--sand-2);
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 70px;
}

.search-input {
  flex-grow: 1;
  padding: 0.4rem;
  border: none;
  color: var(--sand-2);
}

.role-filters {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.builds-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  padding: 0 1rem;
}

.build-card {
  flex: 0 0 450px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: move;
  position: relative;
}

.build-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.build-link {
  text-decoration: none;
  color: inherit;
}

.visibility-badge {
  position: absolute;
  top: 1.5rem;
  right: 9.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--gold-lol);
  color: var(--nox-grey4);
  z-index: 1;
}

.visibility-badge.is-hidden {
  background: var(--nox-grey4);
  color: var(--nox-gold4);
}

.build-card.no-drag {
  cursor: default;

  &:hover {
    transform: none;
    box-shadow: none;
  }
}

@media (max-width: 768px) {
  .actions-group {
    flex-direction: column;
    width: 100%;
  }

  .search-box,
  .visibility-select,
  .create-btn {
    width: 100%;
    height: 30px;
  }

  .btn-text {
    display: inline;
  }

  .role-filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    justify-content: flex-start;
    padding: 0 1rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .role-filters::-webkit-scrollbar {
    display: none;
  }

  .role-filters {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem;
    margin: 1rem 0;
  }

  .role-btn {
    padding: 0.5rem;
    min-width: 40px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .role-btn img {
    width: 24px;
    height: 24px;
  }

  .builds-grid {
    margin-top: 1rem;
  }

  .builds-page {
    padding-top: 4rem;
  }

  .builds-grid {
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .build-card {
    flex: 0 0 100%;
  }

  .role-btn {
    padding: 0.3rem;
  }

  .role-btn img {
    width: 18px;
    height: 18px;
  }

  .visibility-select {
    width: 100%;
    margin: 0.5rem 0;
  }
}
</style>
