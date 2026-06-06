const DEFAULT_DESCRIPTION =
  'Identify pills by photo, imprint code, or description. Check drug interactions and save your personal pill cabinet.'

const SITE_NAME = 'What The Pill'

export function useSiteSeo(options = {}) {
  const route = useRoute()
  const { public: { siteUrl } } = useRuntimeConfig()

  const baseUrl = computed(() => siteUrl.replace(/\/$/, ''))
  const path = computed(() => toValue(options.path) ?? route.path)
  const canonicalUrl = computed(() => {
    const p = path.value.startsWith('/') ? path.value : `/${path.value}`
    return `${baseUrl.value}${p}`
  })

  const title = computed(() => {
    const pageTitle = toValue(options.title)?.trim()
    return pageTitle ? `${pageTitle} · ${SITE_NAME}` : SITE_NAME
  })

  const description = computed(
    () => toValue(options.description)?.trim() || DEFAULT_DESCRIPTION
  )

  const imagePath = computed(() => toValue(options.imagePath) ?? '/og-image.png')
  const imageUrl = computed(() => {
    const p = imagePath.value
    return p.startsWith('http') ? p : `${baseUrl.value}${p}`
  })
  const imageAlt = computed(
    () => toValue(options.imageAlt) ?? `${SITE_NAME} - pill identification app`
  )

  const robots = computed(() =>
    toValue(options.noindex) ? 'noindex, nofollow' : 'index, follow'
  )

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: toValue(options.type) ?? 'website',
    ogUrl: canonicalUrl,
    ogSiteName: SITE_NAME,
    ogLocale: 'en_US',
    ogImage: imageUrl,
    ogImageAlt: imageAlt,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    twitterImageAlt: imageAlt,
    robots,
  })

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  })
}
