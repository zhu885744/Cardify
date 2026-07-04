<template>
  <div class="author-page-wrapper mt-2">
    <div v-if="loading" class="row g-3">
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div class="placeholder-glow">
              <div class="placeholder col-12 mb-3" style="height: 160px;"></div>
              <div class="d-flex gap-3 mb-3">
                <div class="placeholder rounded" style="width: 100px; height: 100px;"></div>
                <div class="flex-grow-1">
                  <div class="placeholder col-6 mb-2" style="height: 24px;"></div>
                  <div class="placeholder col-4 mb-2" style="height: 16px;"></div>
                  <div class="placeholder col-8" style="height: 16px;"></div>
                </div>
              </div>
              <div class="placeholder col-12" style="height: 80px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-exclamation-circle text-danger" style="font-size: 3rem;"></i>
        <p class="mt-3 text-body-secondary">{{ error }}</p>
        <button @click="fetchUserInfo" class="btn btn-outline-primary btn-sm">重试</button>
      </div>
    </div>

    <div v-else-if="!userInfo" class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        <i class="bi bi-person-x text-body-secondary" style="font-size: 3rem;"></i>
        <p class="mt-3 text-body-secondary">用户不存在</p>
      </div>
    </div>

    <template v-else>
      <div class="row g-3 mb-3">
        <div class="col-12">
          <div class="card border-0 shadow-sm overflow-hidden">
            <div class="card-body">
              <div class="d-flex align-items-end gap-3">
                <div class="position-relative flex-shrink-0">
                  <img 
                    :src="userInfo.avatar || defaultAvatar" 
                    :alt="userInfo.nickname"
                    class="rounded-3 border border-4 border-white shadow-sm bg-white"
                    width="110"
                    height="110"
                    style="object-fit: cover;"
                    @error="handleAvatarError"
                  >
                </div>
                
                <div class="flex-grow-1 pb-1">
                  <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <h3 class="fw-bold mb-0">{{ userInfo.nickname }}</h3>
                    <span class="badge bg-primary-subtle text-primary">
                      UID: {{ userId }}
                    </span>
                    <span v-for="group in userGroups" :key="group.name" class="badge bg-success-subtle text-success">
                      {{ group.name }}
                    </span>
                  </div>
                  <p class="text-body-secondary small mb-0">
                    {{ userInfo.description || '这个人很懒，什么都没有留下！' }}
                  </p>
                  <a 
                    :href="userInfo?.json?.website?.url || '#'" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="text-decoration-none"
                  >
                    {{ userInfo?.json?.website?.url }}
                  </a>
                </div>
              </div>

              <div class="d-flex flex-wrap align-items-center gap-3 mt-3 pt-3 border-top">
                <span 
                  v-if="userLevelInfo" 
                  class="badge text-white px-2 py-1"
                  style="background: linear-gradient(135deg, #8b5cf6, #ec4899);"
                >
                  Lv.{{ userLevelInfo.current.value }} {{ userLevelInfo.current.name }}
                </span>
                <span v-if="genderText" class="d-inline-flex align-items-center text-body-secondary small">
                  <i class="bi bi-gender-ambiguous me-1"></i>{{ genderText }}
                </span>
                <span v-if="userInfo.title" class="d-inline-flex align-items-center text-body-secondary small">
                  <i class="bi bi-award me-1"></i>{{ userInfo.title }}
                </span>
                <span v-if="userInfo.create_time" class="d-inline-flex align-items-center text-body-secondary small">
                  <i class="bi bi-calendar me-1"></i>注册于 {{ formatRegisterTime(userInfo.create_time) }}
                </span>
              </div>

              <div v-if="userLevelInfo" class="level-progress-section mt-3">
                <div class="level-progress-header">
                  <span class="level-current">{{ userLevelInfo.current.name }}</span>
                  <span class="level-exp">{{ userStats.totalExp }} / {{ userLevelInfo.next?.exp || '∞' }} 经验</span>
                  <span v-if="userLevelInfo.next" class="level-next">→ {{ userLevelInfo.next.name }}</span>
                </div>
                <div class="level-progress-bar">
                  <div 
                    class="level-progress-fill" 
                    :style="{ width: getLevelProgress() + '%' }"
                  ></div>
                </div>
                <div v-if="userLevelInfo.current.description" class="level-description">
                  {{ userLevelInfo.current.description }}
                </div>
              </div>

              <div class="row text-center g-0 mt-4">
                <div class="col">
                  <div class="fw-bold fs-4 text-body">{{ userStats.articleCount }}</div>
                  <div class="text-body-secondary small">文章</div>
                </div>
                <div class="col border-start">
                  <div class="fw-bold fs-4 text-body">{{ userStats.collectCount }}</div>
                  <div class="text-body-secondary small">收藏</div>
                </div>
                <div class="col border-start">
                  <div class="fw-bold fs-4 text-body">{{ userStats.likeCount }}</div>
                  <div class="text-body-secondary small">点赞</div>
                </div>
                <div class="col border-start">
                  <div class="fw-bold fs-4 text-body">{{ userStats.totalExp }}</div>
                  <div class="text-body-secondary small">经验值</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <ul class="nav nav-pills card-header border-bottom px-3 py-2 gap-2">
              <li class="nav-item">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'articles' }"
                  @click="switchTab('articles')"
                >
                  <i class="bi bi-file-text"></i>
                  <span>文章</span>
                  <span class="badge bg-secondary">{{ userStats.articleCount }}</span>
                </button>
              </li>
              <li class="nav-item" v-if="isOwnProfile">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'pending' }"
                  @click="switchTab('pending')"
                >
                  <i class="bi bi-clock"></i>
                  <span>待审核</span>
                  <span class="badge bg-warning text-dark">{{ pendingArticleCount }}</span>
                </button>
              </li>
              <!-- <li class="nav-item">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'collections' }"
                  @click="switchTab('collections')"
                >
                  <i class="bi bi-bookmark"></i>
                  <span>收藏</span>
                  <span class="badge bg-secondary">{{ userStats.collectCount }}</span>
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'likes' }"
                  @click="switchTab('likes')"
                >
                  <i class="bi bi-heart"></i>
                  <span>点赞</span>
                  <span class="badge bg-secondary">{{ likeArticles.length }}</span>
                </button>
              </li> -->
              <li class="nav-item" v-if="isOwnProfile">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'exp' }"
                  @click="switchTab('exp')"
                >
                  <i class="bi bi-graph-up"></i>
                  <span>经验明细</span>
                </button>
              </li>
              <li class="nav-item" v-if="isOwnProfile">
                <button 
                  class="nav-link d-flex align-items-center gap-2" 
                  :class="{ 'active': activeTab === 'footprint' }"
                  @click="switchTab('footprint')"
                >
                  <i class="bi bi-activity"></i>
                  <span>互动足迹</span>
                </button>
              </li>
            </ul>

            <div class="card-body p-3">
              <div v-if="activeTab === 'articles'">
                <div v-if="articles.length === 0" class="text-center py-5">
                  <i class="bi bi-file-earmark-text text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无文章</p>
                </div>
                <div v-else class="row g-3">
                  <div 
                    v-for="article in articles" 
                    :key="article.id" 
                    class="col-12 col-sm-6 col-lg-4"
                  >
                    <div 
                      class="card h-100 border-0 shadow-sm overflow-hidden article-card"
                      @click="goToArticle(article.id)"
                    >
                      <div class="article-cover-wrapper">
                        <img 
                          :src="article.covers || defaultCover" 
                          :alt="article.title"
                          class="article-cover-img"
                          loading="lazy"
                        >
                      </div>
                      <div class="card-body">
                        <h6 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h6>
                        <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                          {{ article.abstract || '暂无摘要' }}
                        </p>
                        <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                          <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                          <span>{{ formatters.formatDate(article.publish_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="articleTotalPages > 1" class="d-flex justify-content-center pt-4">
                  <nav>
                    <ul class="pagination mb-0">
                      <li class="page-item" :class="{ disabled: currentArticlePage <= 1 }">
                        <button class="page-link" @click.prevent="changeArticlePage(currentArticlePage - 1)">
                          <i class="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      <li 
                        v-for="page in visibleArticlePages" 
                        :key="page" 
                        class="page-item"
                        :class="{ active: page === currentArticlePage, disabled: page === '...' }"
                      >
                        <button class="page-link" @click.prevent="page !== '...' && changeArticlePage(page)">
                          {{ page }}
                        </button>
                      </li>
                      <li class="page-item" :class="{ disabled: currentArticlePage >= articleTotalPages }">
                        <button class="page-link" @click.prevent="changeArticlePage(currentArticlePage + 1)">
                          <i class="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>

              <div v-else-if="activeTab === 'pending'">
                <div v-if="pendingArticles.length === 0" class="text-center py-5">
                  <i class="bi bi-clock text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无待审核文章</p>
                </div>
                <div v-else class="row g-3">
                  <div 
                    v-for="article in pendingArticles" 
                    :key="article.id" 
                    class="col-12 col-sm-6 col-lg-4"
                  >
                    <div 
                      class="card h-100 border-warning border-2 shadow-sm overflow-hidden article-card"
                      @click="goToArticle(article.id)"
                    >
                      <div class="article-cover-wrapper">
                        <img 
                          :src="article.covers || defaultCover" 
                          :alt="article.title"
                          class="article-cover-img"
                          loading="lazy"
                        >
                      </div>
                      <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="card-title fw-bold text-truncate">{{ article.title }}</h6>
                          <span class="badge bg-warning text-dark text-xs">待审核</span>
                        </div>
                        <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                          {{ article.abstract || '暂无摘要' }}
                        </p>
                        <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                          <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                          <span>{{ formatters.formatDate(article.publish_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="pendingTotalPages > 1" class="d-flex justify-content-center pt-4">
                  <nav>
                    <ul class="pagination mb-0">
                      <li class="page-item" :class="{ disabled: currentPendingPage <= 1 }">
                        <button class="page-link" @click.prevent="changePendingPage(currentPendingPage - 1)">
                          <i class="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      <li 
                        v-for="page in visiblePendingPages" 
                        :key="page" 
                        class="page-item"
                        :class="{ active: page === currentPendingPage, disabled: page === '...' }"
                      >
                        <button class="page-link" @click.prevent="page !== '...' && changePendingPage(page)">
                          {{ page }}
                        </button>
                      </li>
                      <li class="page-item" :class="{ disabled: currentPendingPage >= pendingTotalPages }">
                        <button class="page-link" @click.prevent="changePendingPage(currentPendingPage + 1)">
                          <i class="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>

              <div v-else-if="activeTab === 'collections'">
                <div v-if="collectionLoading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                  </div>
                  <p class="text-body-secondary mt-3">加载中...</p>
                </div>
                <div v-else-if="collectionArticles.length === 0" class="text-center py-5">
                  <i class="bi bi-bookmark-x text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无收藏</p>
                </div>
                <div v-else>
                  <div class="row g-3">
                    <div 
                      v-for="article in collectionArticles" 
                      :key="article.id" 
                      class="col-12 col-sm-6 col-lg-4"
                    >
                      <div 
                        class="card h-100 border-0 shadow-sm overflow-hidden article-card"
                        @click="goToArticle(article.id)"
                      >
                        <div class="article-cover-wrapper">
                          <img 
                            :src="article.covers || defaultCover" 
                            :alt="article.title"
                            class="article-cover-img"
                            loading="lazy"
                          >
                        </div>
                        <div class="card-body">
                          <h6 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h6>
                          <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                            {{ article.abstract || '暂无摘要' }}
                          </p>
                          <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                            <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                            <span>{{ formatters.formatDate(article.publish_time) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="collectionTotalPages > 1" class="d-flex justify-content-center pt-4">
                    <nav>
                      <ul class="pagination mb-0">
                        <li class="page-item" :class="{ disabled: currentCollectionPage <= 1 }">
                          <button class="page-link" @click.prevent="changeCollectionPage(currentCollectionPage - 1)">
                            <i class="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        <li 
                          v-for="page in visibleCollectionPages" 
                          :key="page" 
                          class="page-item"
                          :class="{ active: page === currentCollectionPage, disabled: page === '...' }"
                        >
                          <button class="page-link" @click.prevent="page !== '...' && changeCollectionPage(page)">
                            {{ page }}
                          </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentCollectionPage >= collectionTotalPages }">
                          <button class="page-link" @click.prevent="changeCollectionPage(currentCollectionPage + 1)">
                            <i class="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'likes'">
                <div v-if="likeLoading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                  </div>
                  <p class="text-body-secondary mt-3">加载中...</p>
                </div>
                <div v-else-if="likeArticles.length === 0" class="text-center py-5">
                  <i class="bi bi-heart text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无点赞</p>
                </div>
                <div v-else>
                  <div class="row g-3">
                    <div 
                      v-for="article in likeArticles" 
                      :key="article.id" 
                      class="col-12 col-sm-6 col-lg-4"
                    >
                      <div 
                        class="card h-100 border-0 shadow-sm overflow-hidden article-card"
                        @click="goToArticle(article.id)"
                      >
                        <div class="article-cover-wrapper">
                          <img 
                            :src="article.covers || defaultCover" 
                            :alt="article.title"
                            class="article-cover-img"
                            loading="lazy"
                          >
                        </div>
                        <div class="card-body">
                          <h6 class="card-title fw-bold text-truncate mb-2">{{ article.title }}</h6>
                          <p class="card-text text-body-secondary small line-clamp-2 mb-2">
                            {{ article.abstract || '暂无摘要' }}
                          </p>
                          <div class="d-flex justify-content-between align-items-center text-body-secondary small">
                            <span>{{ article?.result?.group?.[0]?.name || '未分类' }}</span>
                            <span>{{ formatters.formatDate(article.publish_time) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="likeTotalPages > 1" class="d-flex justify-content-center pt-4">
                    <nav>
                      <ul class="pagination mb-0">
                        <li class="page-item" :class="{ disabled: currentLikePage <= 1 }">
                          <button class="page-link" @click.prevent="changeLikePage(currentLikePage - 1)">
                            <i class="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        <li 
                          v-for="page in visibleLikePages" 
                          :key="page" 
                          class="page-item"
                          :class="{ active: page === currentLikePage, disabled: page === '...' }"
                        >
                          <button class="page-link" @click.prevent="page !== '...' && changeLikePage(page)">
                            {{ page }}
                          </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentLikePage >= likeTotalPages }">
                          <button class="page-link" @click.prevent="changeLikePage(currentLikePage + 1)">
                            <i class="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'exp'">
                <div v-if="expLoading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                  </div>
                  <p class="text-body-secondary mt-3">加载中...</p>
                </div>
                <div v-else-if="expRecords.length === 0" class="text-center py-5">
                  <i class="bi bi-graph-up text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无经验记录</p>
                </div>
                <div v-else>
                  <div class="exp-list">
                    <div 
                      v-for="record in expRecords" 
                      :key="record.id"
                      class="exp-item"
                    >
                      <div class="exp-icon" :class="getExpTypeClass(record.type)">
                        <i class="bi" :class="getExpIcon(record.type)"></i>
                      </div>
                      <div class="exp-info">
                        <div class="exp-title">{{ getExpTitle(record) }}</div>
                        <div class="exp-time">{{ formatters.formatDate(record.create_time) }}</div>
                      </div>
                      <div class="exp-value" :class="{ positive: record.value > 0, negative: record.value < 0 }">
                        {{ record.value > 0 ? '+' : '' }}{{ record.value }}
                      </div>
                    </div>
                  </div>
                  <div v-if="expTotalPages > 1" class="d-flex justify-content-center pt-4">
                    <nav>
                      <ul class="pagination mb-0">
                        <li class="page-item" :class="{ disabled: currentExpPage <= 1 }">
                          <button class="page-link" @click.prevent="changeExpPage(currentExpPage - 1)">
                            <i class="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        <li 
                          v-for="page in visibleExpPages" 
                          :key="page" 
                          class="page-item"
                          :class="{ active: page === currentExpPage, disabled: page === '...' }"
                        >
                          <button class="page-link" @click.prevent="page !== '...' && changeExpPage(page)">
                            {{ page }}
                          </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentExpPage >= expTotalPages }">
                          <button class="page-link" @click.prevent="changeExpPage(currentExpPage + 1)">
                            <i class="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'footprint'">
                <div class="footprint-tabs mb-3">
                  <button
                    v-for="item in footprintTypes"
                    :key="item.key"
                    class="footprint-tab"
                    :class="{ active: footprintType === item.key }"
                    @click="switchFootprintType(item.key)"
                  >
                    <i class="bi" :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                  </button>
                </div>
                <div v-if="footprintLoading" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                  </div>
                  <p class="text-body-secondary mt-3">加载中...</p>
                </div>
                <div v-else-if="footprintRecords.length === 0" class="text-center py-5">
                  <i class="bi bi-activity text-body-secondary" style="font-size: 3rem;"></i>
                  <p class="text-body-secondary mt-2">暂无{{ getFootprintTypeName() }}记录</p>
                </div>
                <div v-else>
                  <div class="footprint-list">
                    <div 
                      v-for="record in footprintRecords" 
                      :key="record.id"
                      class="footprint-item"
                    >
                      <div class="footprint-icon" :class="getFootprintIconClass(record.type)">
                        <i class="bi" :class="getFootprintIcon(record.type)"></i>
                      </div>
                      <div class="footprint-info">
                        <div class="footprint-title">{{ getFootprintTitle(record) }}</div>
                        <div class="footprint-time">{{ formatters.formatDate(record.create_time) }}</div>
                      </div>
                    </div>
                  </div>
                  <div v-if="footprintTotalPages > 1" class="d-flex justify-content-center pt-4">
                    <nav>
                      <ul class="pagination mb-0">
                        <li class="page-item" :class="{ disabled: currentFootprintPage <= 1 }">
                          <button class="page-link" @click.prevent="changeFootprintPage(currentFootprintPage - 1)">
                            <i class="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        <li 
                          v-for="page in visibleFootprintPages" 
                          :key="page" 
                          class="page-item"
                          :class="{ active: page === currentFootprintPage, disabled: page === '...' }"
                        >
                          <button class="page-link" @click.prevent="page !== '...' && changeFootprintPage(page)">
                            {{ page }}
                          </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentFootprintPage >= footprintTotalPages }">
                          <button class="page-link" @click.prevent="changeFootprintPage(currentFootprintPage + 1)">
                            <i class="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '@/utils/network'
import { cache } from '@/utils/network'
import utils from '@/utils/utils'
import defaultAvatar from '@/assets/img/avatar.png'
import defaultCover from '@/assets/img/fm.avif'
import { useCommStore } from '@/store/comm'
import { formatters } from '@/utils/app'

const route = useRoute()
const router = useRouter()
const store = useCommStore()

const SITE_TITLE = import.meta.env.VITE_TITLE || 'Xiao-INIS'

const getSiteTitle = () => {
  return store.siteInfo?.title || SITE_TITLE
}

const loading = ref(false)
const error = ref('')
const userInfo = ref(null)
const activeTab = ref('articles')

const articles = ref([])
const articleCount = ref(0)
const currentArticlePage = ref(1)
const articleTotalPages = ref(1)

const pendingArticles = ref([])
const pendingArticleCount = ref(0)
const currentPendingPage = ref(1)
const pendingTotalPages = ref(1)

const collectionArticles = ref([])
const collectionLoading = ref(false)
const currentCollectionPage = ref(1)
const collectionTotalPages = ref(1)
const collectionTotalCount = ref(0)

const likeArticles = ref([])
const likeLoading = ref(false)
const currentLikePage = ref(1)
const likeTotalPages = ref(1)
const likeTotalCount = ref(0)

const expRecords = ref([])
const expLoading = ref(false)
const currentExpPage = ref(1)
const expTotalPages = ref(1)
const expTotalCount = ref(0)

const footprintRecords = ref([])
const footprintLoading = ref(false)
const currentFootprintPage = ref(1)
const footprintTotalPages = ref(1)
const footprintType = ref('like')

const footprintTypes = [
  { key: 'like', label: '点赞', icon: 'bi-heart' },
  { key: 'collect', label: '收藏', icon: 'bi-bookmark' },
  { key: 'share', label: '分享', icon: 'bi-share' },
  { key: 'comment', label: '评论', icon: 'bi-chat-dots' },
  { key: 'visit', label: '访问', icon: 'bi-eye' },
]

const userStats = ref({
  articleCount: 0,
  collectCount: 0,
  likeCount: 0,
  totalExp: 0
})

const userId = computed(() => {
  return route.params.id || 1
})

const isOwnProfile = computed(() => {
  const loggedInUserId = store.login.user?.id
  return loggedInUserId && String(loggedInUserId) === String(userId.value)
})

const isAdmin = computed(() => {
  if (!userInfo.value || !userInfo.value.result?.auth) return false
  return userInfo.value.result.auth.all || 
    (userInfo.value.result.auth.group?.list && 
     userInfo.value.result.auth.group.list.some(group => group.key === 'admin'))
})

const userLevelInfo = computed(() => {
  return userInfo.value?.result?.level
})

const getLevelProgress = () => {
  if (!userLevelInfo.value) return 0
  const currentExp = userLevelInfo.value.current.exp || 0
  const nextExp = userLevelInfo.value.next?.exp || 0
  const totalExp = userStats.value.totalExp || 0
  
  if (nextExp === 0) return 100 // 已满级
  
  const progress = ((totalExp - currentExp) / (nextExp - currentExp)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

const userAuthInfo = computed(() => {
  return userInfo.value?.result?.auth
})

const userGroups = computed(() => {
  if (!userAuthInfo.value) {
    return []
  }
  if (userAuthInfo.value.group?.list && userAuthInfo.value.group.list.length > 0) {
    return userAuthInfo.value.group.list
  }
  return []
})

const genderText = computed(() => {
  const gender = userInfo.value?.gender
  const genderMap = {
    'boy': '男',
    'girl': '女',
    1: '男',
    2: '女'
  }
  return genderMap[gender] || ''
})

const formatRegisterTime = (timestamp) => {
  return utils.timeToDate(timestamp, 'Y年m月d日')
}

const fetchUserInfo = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const cacheKey = `author_user_info_${userId.value}`
    const cacheExpire = 30
    
    const cachedUserInfo = cache.get(cacheKey)
    if (cachedUserInfo) {
      userInfo.value = cachedUserInfo
      if (cachedUserInfo.exp !== undefined) {
        userStats.value.totalExp = cachedUserInfo.exp
      }
      loading.value = false
      return
    }
    
    const res = await request.get('/api/users/one', {
      id: userId.value
    })
    
    if (res.code === 200 && res.data) {
      userInfo.value = res.data
      cache.set(cacheKey, res.data, cacheExpire)
      if (res.data.exp !== undefined) {
        userStats.value.totalExp = res.data.exp
      }
    } else {
      error.value = res.msg || '获取用户信息失败'
      userInfo.value = null
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    userInfo.value = null
  } finally {
    loading.value = false
  }
}

const fetchUserArticles = async () => {
  try {
    if (!userId.value) return
    
    const whereParam = JSON.stringify({ uid: userId.value, audit: 1 })
    
    const [articlesRes, countRes] = await Promise.all([
      request.get('/api/article/all', {
        where: whereParam,
        page: currentArticlePage.value,
        limit: 9,
        order: 'create_time desc'
      }),
      request.get('/api/article/count', {
        where: whereParam
      })
    ])
    
    if (articlesRes.code === 200) {
      if (articlesRes.data && articlesRes.data.data) {
        articles.value = articlesRes.data.data
        articleCount.value = articlesRes.data.count || 0
      } else if (articlesRes.data && Array.isArray(articlesRes.data)) {
        articles.value = articlesRes.data
        articleCount.value = articlesRes.count || 0
      } else {
        articles.value = []
        articleCount.value = 0
      }
    } else {
      articles.value = []
      articleCount.value = 0
    }
    
    if (countRes.code === 200) {
      const count = countRes.data?.count ?? countRes.count ?? countRes.data ?? 0
      articleCount.value = count
      articleTotalPages.value = Math.ceil(count / 9) || 1
    }
  } catch (err) {
    articles.value = []
    articleCount.value = 0
  }
}

const fetchPendingArticles = async () => {
  try {
    if (!userId.value) return
    
    const whereParam = JSON.stringify({ uid: userId.value, audit: 0 })
    
    const [articlesRes, countRes] = await Promise.all([
      request.get('/api/article/all', {
        where: whereParam,
        page: currentPendingPage.value,
        limit: 9,
        order: 'create_time desc'
      }),
      request.get('/api/article/count', {
        where: whereParam
      })
    ])
    
    if (articlesRes.code === 200) {
      if (articlesRes.data && articlesRes.data.data) {
        pendingArticles.value = articlesRes.data.data
        pendingArticleCount.value = articlesRes.data.count || 0
      } else if (articlesRes.data && Array.isArray(articlesRes.data)) {
        pendingArticles.value = articlesRes.data
        pendingArticleCount.value = articlesRes.count || 0
      } else {
        pendingArticles.value = []
        pendingArticleCount.value = 0
      }
    } else {
      pendingArticles.value = []
      pendingArticleCount.value = 0
    }
    
    if (countRes.code === 200) {
      const count = countRes.data?.count ?? countRes.count ?? countRes.data ?? 0
      pendingArticleCount.value = count
      pendingTotalPages.value = Math.ceil(count / 9) || 1
    }
  } catch (err) {
    pendingArticles.value = []
    pendingArticleCount.value = 0
  }
}

const fetchUserCollections = async () => {
  try {
    if (!userId.value) return
    
    collectionLoading.value = true
    
    const whereParam = JSON.stringify({ uid: userId.value, type: 'collect', bind_type: 'article', state: 1 })
    const res = await request.get('/api/exp/all', {
      where: whereParam,
      field: 'bind_id,create_time',
      page: currentCollectionPage.value,
      limit: 10,
      order: 'create_time desc'
    })
    
    if (res.code === 200 && res.data) {
      const expList = Array.isArray(res.data) ? res.data : res.data.data || []
      collectionTotalCount.value = res.data.count || res.count || expList.length || 0
      collectionTotalPages.value = Math.ceil(collectionTotalCount.value / 10) || 1
      
      const articleIds = expList.map(item => item.bind_id).filter(id => id)
      
      if (articleIds.length > 0) {
        const articleWhere = JSON.stringify({ id: { '$in': articleIds } })
        const articleRes = await request.get('/api/article/all', {
          where: articleWhere,
          limit: 10
        })
        
        if (articleRes.code === 200) {
          collectionArticles.value = articleRes.data?.data || articleRes.data || []
        } else {
          collectionArticles.value = []
        }
      } else {
        collectionArticles.value = []
      }
    } else {
      collectionArticles.value = []
      collectionTotalCount.value = 0
      collectionTotalPages.value = 1
    }
  } catch (err) {
    collectionArticles.value = []
    collectionTotalCount.value = 0
    collectionTotalPages.value = 1
  } finally {
    collectionLoading.value = false
  }
}

const fetchUserLikes = async () => {
  try {
    if (!userId.value) return
    
    likeLoading.value = true
    
    const whereParam = JSON.stringify({ uid: userId.value, type: 'like', bind_type: 'article', state: 1 })
    const res = await request.get('/api/exp/all', {
      where: whereParam,
      field: 'bind_id,create_time',
      page: currentLikePage.value,
      limit: 10,
      order: 'create_time desc'
    })
    
    if (res.code === 200 && res.data) {
      const expList = Array.isArray(res.data) ? res.data : res.data.data || []
      likeTotalCount.value = res.data.count || res.count || expList.length || 0
      likeTotalPages.value = Math.ceil(likeTotalCount.value / 10) || 1
      
      const articleIds = expList.map(item => item.bind_id).filter(id => id)
      
      if (articleIds.length > 0) {
        const articleWhere = JSON.stringify({ id: { '$in': articleIds } })
        const articleRes = await request.get('/api/article/all', {
          where: articleWhere,
          limit: 10
        })
        
        if (articleRes.code === 200) {
          likeArticles.value = articleRes.data?.data || articleRes.data || []
        } else {
          likeArticles.value = []
        }
      } else {
        likeArticles.value = []
      }
    } else {
      likeArticles.value = []
      likeTotalCount.value = 0
      likeTotalPages.value = 1
    }
  } catch (err) {
    likeArticles.value = []
    likeTotalCount.value = 0
    likeTotalPages.value = 1
  } finally {
    likeLoading.value = false
  }
}

const visibleArticlePages = computed(() => {
  const total = articleTotalPages.value
  const current = currentArticlePage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const visiblePendingPages = computed(() => {
  const total = pendingTotalPages.value
  const current = currentPendingPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const visibleExpPages = computed(() => {
  const total = expTotalPages.value
  const current = currentExpPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const visibleLikePages = computed(() => {
  const total = likeTotalPages.value
  const current = currentLikePage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const visibleCollectionPages = computed(() => {
  const total = collectionTotalPages.value
  const current = currentCollectionPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const visibleFootprintPages = computed(() => {
  const total = footprintTotalPages.value
  const current = currentFootprintPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const getExpIcon = (type) => {
  const iconMap = {
    'check-in': 'bi-calendar-check',
    'like': 'bi-heart',
    'collect': 'bi-bookmark',
    'share': 'bi-share',
    'comment': 'bi-chat-dots',
    'visit': 'bi-eye',
  }
  return iconMap[type] || 'bi-star'
}

const getExpTypeClass = (type) => {
  const classMap = {
    'check-in': 'exp-checkin',
    'like': 'exp-like',
    'collect': 'exp-collect',
    'share': 'exp-share',
    'comment': 'exp-comment',
    'visit': 'exp-visit',
  }
  return classMap[type] || 'exp-default'
}

const getExpTitle = (record) => {
  if (record.description) {
    return record.description
  }
  const titleMap = {
    'check-in': '签到奖励',
    'like': '点赞奖励',
    'collect': '收藏奖励',
    'share': '分享奖励',
    'comment': '评论奖励',
    'visit': '访问奖励',
  }
  return titleMap[record.type] || '经验变动'
}

const getFootprintIcon = (type) => {
  const iconMap = {
    'like': 'bi-heart',
    'collect': 'bi-bookmark',
    'share': 'bi-share',
    'comment': 'bi-chat-dots',
    'visit': 'bi-eye',
  }
  return iconMap[type] || 'bi-activity'
}

const getFootprintIconClass = (type) => {
  const classMap = {
    'like': 'fp-like',
    'collect': 'fp-collect',
    'share': 'fp-share',
    'comment': 'fp-comment',
    'visit': 'fp-visit',
  }
  return classMap[type] || 'fp-default'
}

const getFootprintTitle = (record) => {
  if (record.description) {
    return record.description
  }
  if (record.bind_type && record.bind_id) {
    const typeMap = {
      'article': '文章',
      'page': '页面',
      'comment': '评论',
    }
    return `${typeMap[record.bind_type] || '内容'} #${record.bind_id}`
  }
  const titleMap = {
    'like': '点赞了内容',
    'collect': '收藏了内容',
    'share': '分享了内容',
    'comment': '发表了评论',
    'visit': '访问了页面',
  }
  return titleMap[record.type] || '互动记录'
}

const getFootprintTypeName = () => {
  const type = footprintTypes.find(t => t.key === footprintType.value)
  return type ? type.label : ''
}

const switchTab = (tab) => {
  if ((tab === 'pending' || tab === 'exp' || tab === 'footprint') && !isOwnProfile.value) {
    return
  }
  activeTab.value = tab
  if (tab === 'articles') {
    fetchUserArticles()
  } else if (tab === 'pending') {
    fetchPendingArticles()
  } else if (tab === 'collections') {
    fetchUserCollections()
  } else if (tab === 'likes') {
    fetchUserLikes()
  } else if (tab === 'exp') {
    fetchExpRecords()
  } else if (tab === 'footprint') {
    fetchFootprintRecords()
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const fetchExpRecords = async () => {
  try {
    if (!userId.value) return
    
    expLoading.value = true
    const whereParam = JSON.stringify({ uid: userId.value })
    const res = await request.get('/api/exp/all', {
      where: whereParam,
      page: currentExpPage.value,
      limit: 20,
      order: 'create_time desc'
    })
    
    if (res.code === 200 && res.data) {
      if (res.data.data && Array.isArray(res.data.data)) {
        expRecords.value = res.data.data
        expTotalCount.value = res.data.count || 0
      } else if (Array.isArray(res.data)) {
        expRecords.value = res.data
        expTotalCount.value = res.count || res.data.length || 0
      } else {
        expRecords.value = []
        expTotalCount.value = 0
      }
      expTotalPages.value = Math.ceil(expTotalCount.value / 20) || 1
    } else {
      expRecords.value = []
      expTotalCount.value = 0
      expTotalPages.value = 1
    }
  } catch (err) {
    expRecords.value = []
    expTotalCount.value = 0
    expTotalPages.value = 1
  } finally {
    expLoading.value = false
  }
}

const changeExpPage = (page) => {
  if (page < 1 || page > expTotalPages.value) return
  currentExpPage.value = page
  fetchExpRecords()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const fetchFootprintRecords = async () => {
  try {
    if (!userId.value) return
    
    footprintLoading.value = true
    const whereParam = JSON.stringify({ uid: userId.value, type: footprintType.value })
    const res = await request.get('/api/exp/all', {
      where: whereParam,
      page: currentFootprintPage.value,
      limit: 20,
      order: 'create_time desc'
    })
    
    if (res.code === 200 && res.data) {
      if (res.data.data && Array.isArray(res.data.data)) {
        footprintRecords.value = res.data.data
        const count = res.data.count || 0
        footprintTotalPages.value = Math.ceil(count / 20) || 1
      } else if (Array.isArray(res.data)) {
        footprintRecords.value = res.data
        const count = res.count || res.data.length || 0
        footprintTotalPages.value = Math.ceil(count / 20) || 1
      } else {
        footprintRecords.value = []
        footprintTotalPages.value = 1
      }
    } else {
      footprintRecords.value = []
      footprintTotalPages.value = 1
    }
  } catch (err) {
    footprintRecords.value = []
    footprintTotalPages.value = 1
  } finally {
    footprintLoading.value = false
  }
}

const switchFootprintType = (type) => {
  footprintType.value = type
  currentFootprintPage.value = 1
  footprintRecords.value = []
  fetchFootprintRecords()
}

const changeCollectionPage = (page) => {
  if (page < 1 || page > collectionTotalPages.value) return
  currentCollectionPage.value = page
  collectionArticles.value = []
  fetchUserCollections()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const changeLikePage = (page) => {
  if (page < 1 || page > likeTotalPages.value) return
  currentLikePage.value = page
  likeArticles.value = []
  fetchUserLikes()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const changeFootprintPage = (page) => {
  if (page < 1 || page > footprintTotalPages.value) return
  currentFootprintPage.value = page
  fetchFootprintRecords()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const changeArticlePage = (page) => {
  if (page < 1 || page > articleTotalPages.value) return
  currentArticlePage.value = page
  fetchUserArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const changePendingPage = (page) => {
  if (page < 1 || page > pendingTotalPages.value) return
  currentPendingPage.value = page
  fetchPendingArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getArticleCount = async (userId) => {
  try {
    const publishedWhere = JSON.stringify({ uid: userId, audit: 1 })
    const pendingWhere = JSON.stringify({ uid: userId, audit: 0 })
    
    const [publishedRes, pendingRes] = await Promise.all([
      request.get('/api/article/count', { where: publishedWhere }),
      request.get('/api/article/count', { where: pendingWhere })
    ])
    const published = publishedRes.code === 200 ? publishedRes.data : 0
    const pending = pendingRes.code === 200 ? pendingRes.data : 0
    return { published, pending }
  } catch (error) {
    return { published: 0, pending: 0 }
  }
}

const getCollectCount = async (userId) => {
  try {
    const whereParam = JSON.stringify({ uid: userId, type: 'collect', state: 1 })
    const response = await request.get('/api/exp/count', {
      where: whereParam
    })
    if (response.code === 200) {
      return response.data
    }
    return 0
  } catch (error) {
    return 0
  }
}

const getLikeCount = async (userId) => {
  try {
    const whereParam = JSON.stringify({ uid: userId, type: 'like', state: 1 })
    const response = await request.get('/api/exp/count', {
      where: whereParam
    })
    if (response.code === 200) {
      return response.data
    }
    return 0
  } catch (error) {
    return 0
  }
}

const initUserStats = async () => {
  if (!userId.value) return
  
  const cacheKey = `author_user_stats_${userId.value}`
  const cacheExpire = 10
  
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    userStats.value = cachedData
    if (userInfo.value?.exp !== undefined) {
      userStats.value.totalExp = userInfo.value.exp
    }
    if (cachedData.pendingArticleCount !== undefined) {
      pendingArticleCount.value = cachedData.pendingArticleCount
    }
    return
  }
  
  try {
    const [articleCountData, collectCount, likeCount] = await Promise.all([
      getArticleCount(userId.value),
      getCollectCount(userId.value),
      getLikeCount(userId.value)
    ])
    
    userStats.value = {
      articleCount: articleCountData.published,
      collectCount,
      likeCount,
      totalExp: userInfo.value?.exp || 0,
      pendingArticleCount: articleCountData.pending
    }
    pendingArticleCount.value = articleCountData.pending
    
    cache.set(cacheKey, userStats.value, cacheExpire)
  } catch (error) {
    userStats.value = {
      articleCount: 0,
      collectCount: 0,
      likeCount: 0,
      totalExp: userInfo.value?.exp || 0
    }
  }
}

const goToArticle = (articleId) => {
  const validArticleId = parseInt(articleId)
  if (!isNaN(validArticleId) && validArticleId > 0) {
    router.push(`/archives/${validArticleId}`)
  }
}

const handleAvatarError = (event) => {
  event.target.src = defaultAvatar
}

const setPageTitle = (nickname) => {
  if (nickname) {
    document.title = `${nickname} - ${getSiteTitle()}`
  } else {
    document.title = `用户主页 - ${getSiteTitle()}`
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchUserArticles()
  initUserStats()
})

onUnmounted(() => {
  document.title = getSiteTitle()
})

watch(
  () => userInfo.value,
  (newUserInfo) => {
    if (newUserInfo) {
      setPageTitle(newUserInfo.nickname)
    } else {
      setPageTitle('')
    }
  },
  { immediate: true }
)

watch(
  () => route.params.id,
  (newUserId) => {
    if (newUserId) {
      currentArticlePage.value = 1
      currentCollectionPage.value = 1
      currentLikePage.value = 1
      currentExpPage.value = 1
      currentFootprintPage.value = 1
      expRecords.value = []
      footprintRecords.value = []
      collectionArticles.value = []
      likeArticles.value = []
      fetchUserInfo()
      fetchUserArticles()
      initUserStats()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card {
  cursor: pointer;
  transition: all 0.25s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12) !important;
}

.article-cover-wrapper {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background-color: #f3f4f6;
}

.article-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.article-card:hover .article-cover-img {
  transform: scale(1.05);
}

.nav-pills .nav-link {
  color: #6c757d;
  background: transparent;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-pills .nav-link:hover {
  background-color: #f8f9fa;
}

.nav-pills .nav-link.active {
  background-color: #0d6efd;
  color: #fff;
}

.nav-pills .nav-link.active .badge {
  background-color: rgba(255, 255, 255, 0.25) !important;
}

[bs-theme=dark] .article-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4) !important;
}

[bs-theme=dark] .nav-pills .nav-link:hover {
  background-color: #2b2b2b;
}

[bs-theme=dark] .article-cover-wrapper {
  background-color: #1f1f1f;
}

.exp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exp-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--bs-tertiary-bg);
  transition: all 0.2s;
}

.exp-item:hover {
  background: var(--bs-secondary-bg);
}

.exp-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.exp-icon.exp-checkin {
  background: rgba(13, 110, 253, 0.15);
  color: #0d6efd;
}

.exp-icon.exp-like {
  background: rgba(220, 53, 69, 0.15);
  color: #dc3545;
}

.exp-icon.exp-collect {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.exp-icon.exp-share {
  background: rgba(25, 135, 84, 0.15);
  color: #198754;
}

.exp-icon.exp-comment {
  background: rgba(111, 66, 193, 0.15);
  color: #6f42c1;
}

.exp-icon.exp-visit {
  background: rgba(13, 202, 240, 0.15);
  color: #0dcaf0;
}

.exp-icon.exp-default {
  background: rgba(108, 117, 125, 0.15);
  color: #6c757d;
}

.exp-info {
  flex: 1;
  min-width: 0;
}

.exp-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--bs-body-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exp-time {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  margin-top: 2px;
}

.exp-value {
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.exp-value.positive {
  color: #198754;
}

.exp-value.negative {
  color: #dc3545;
}

.footprint-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.footprint-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--bs-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--bs-secondary-color);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.footprint-tab:hover {
  border-color: var(--bs-primary);
  color: var(--bs-primary);
}

.footprint-tab.active {
  border-color: var(--bs-primary);
  background: var(--bs-primary);
  color: white;
}

.footprint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footprint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--bs-tertiary-bg);
  transition: all 0.2s;
}

.footprint-item:hover {
  background: var(--bs-secondary-bg);
}

.footprint-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.footprint-icon.fp-like {
  background: rgba(220, 53, 69, 0.15);
  color: #dc3545;
}

.footprint-icon.fp-collect {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.footprint-icon.fp-share {
  background: rgba(25, 135, 84, 0.15);
  color: #198754;
}

.footprint-icon.fp-comment {
  background: rgba(111, 66, 193, 0.15);
  color: #6f42c1;
}

.footprint-icon.fp-visit {
  background: rgba(13, 202, 240, 0.15);
  color: #0dcaf0;
}

.footprint-icon.fp-default {
  background: rgba(108, 117, 125, 0.15);
  color: #6c757d;
}

.footprint-info {
  flex: 1;
  min-width: 0;
}

.footprint-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--bs-body-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footprint-time {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  margin-top: 2px;
}

.pagination .page-link {
  min-width: 36px;
  text-align: center;
}

.level-progress-section {
  padding: 12px;
  border-radius: 8px;
  background: var(--bs-tertiary-bg);
}

.level-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.level-current {
  font-weight: 600;
  color: var(--bs-primary);
}

.level-exp {
  color: var(--bs-secondary-color);
}

.level-next {
  color: var(--bs-success);
  font-size: 0.8rem;
}

.level-progress-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--bs-border-color);
  overflow: hidden;
}

.level-progress-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transition: width 0.3s ease;
}

.level-description {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  line-height: 1.4;
}

[data-bs-theme="dark"] .level-progress-section {
  background: rgba(139, 92, 246, 0.1);
}

[data-bs-theme="dark"] .level-progress-bar {
  background: rgba(255, 255, 255, 0.1);
}
</style>
