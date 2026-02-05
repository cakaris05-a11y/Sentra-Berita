import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function fetchNews() {
  try {
    console.log('🔍 Fetching news from GNews for Santra Berita...')
    
    // Fetch dari GNews API
    const response = await fetch(
      `https://gnews.io/api/v4/top-headlines?country=id&lang=id&max=10&token=${process.env.GNEWS_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error(`GNews API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.articles || data.articles.length === 0) {
      console.log('⚠️  No articles found')
      return
    }

    console.log(`📰 Found ${data.articles.length} articles for Santra Berita`)

    // Transform data untuk Supabase
    const articles = data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      image_url: article.image,
      source: article.source.name,
      published_at: article.publishedAt
    }))

    // Insert ke Supabase
    const { data: inserted, error } = await supabase
      .from('articles')
      .upsert(articles, { 
        onConflict: 'url',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      process.exit(1)
    }

    console.log(`✅ Successfully inserted ${inserted?.length || articles.length} articles to Santra Berita database`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fetchNews()
