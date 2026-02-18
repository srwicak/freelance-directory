'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search, UserPlus, Shield, Database, KeyRound, Users, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 }
  }
}

const features = [
  {
    icon: Database,
    title: "Terdata Rapi",
    description: "Direktori terstruktur berdasarkan bidang keahlian dan lokasi memudahkan pencarian talent.",
    color: "from-indigo-500/20 to-violet-500/20",
    iconColor: "text-indigo-600",
  },
  {
    icon: Shield,
    title: "Privasi Terjaga",
    description: "Detail kontak hanya bisa dilihat oleh sesama anggota terdaftar dalam komunitas.",
    color: "from-sky-500/20 to-blue-500/20",
    iconColor: "text-blue-600",
  },
  {
    icon: KeyRound,
    title: "Tanpa Login Rumit",
    description: "Cukup simpan ID unik Anda. Tidak perlu password atau email untuk akses kapan saja.",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-orange-600",
  },
]

export default function Home() {
  return (
    <div className="bg-gradient-hero min-h-[calc(100vh-4rem)] -mx-4 md:-mx-8 -mt-6 md:-mt-10 px-4 md:px-8 pt-6 md:pt-10">
      {/* Hero Section */}
      <motion.section
        className="flex flex-col items-center justify-center text-center pt-16 md:pt-24 pb-16 md:pb-20"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium badge-primary">
            <Sparkles className="h-4 w-4" />
            Gratis &amp; Terbuka untuk Semua Bidang
          </span>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-5 max-w-3xl mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Komunitas{" "}
            <span className="text-gradient">Freelancer</span>
            <br />
            Indonesia
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Temukan partner kerja terbaik atau gabung untuk memperluas jaringan Anda.
            Sistem direktori privat untuk menjaga privasi anggota.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md sm:max-w-none"
        >
          <Button asChild size="lg" className="h-14 px-8 text-base font-semibold bg-gradient-primary hover:opacity-90 shadow-lg transition-all rounded-xl">
            <Link href="/register">
              <UserPlus className="mr-2.5 h-5 w-5" />
              Gabung Sekarang
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-xl border-2 border-foreground/20 hover:border-foreground/40">
            <Link href="/directory">
              <Search className="mr-2.5 h-5 w-5" />
              Cari Freelancer
            </Link>
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-6">
          <Link href="/edit-profile" className="text-sm text-foreground/60 hover:text-primary transition-colors flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-muted/50">
            <Users className="w-4 h-4" /> {/* UserCog not imported, reusing Users or importing UserCog? Let's fix import */}
            <span>Sudah terdaftar? <span className="underline decoration-dotted underline-offset-4">Edit Profil Anda</span></span>
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={fadeInUp}
          className="flex items-center gap-8 md:gap-12 mt-14 text-center"
        >
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground">20+</div>
            <div className="text-sm text-muted-foreground mt-0.5">Bidang Keahlian</div>
          </div>
          <div className="w-px h-10 bg-foreground/15"></div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground">38</div>
            <div className="text-sm text-muted-foreground mt-0.5">Provinsi</div>
          </div>
          <div className="w-px h-10 bg-foreground/15"></div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-1">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">Komunitas Aktif</div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="max-w-5xl mx-auto pb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Kenapa Pilih Platform Kami?
          </h2>
          <p className="text-muted-foreground mt-3 text-base md:text-lg">
            Dirancang sederhana namun efektif untuk menghubungkan sesama freelancer
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="group relative p-7 rounded-2xl bg-card border border-border shadow-md shadow-black/5 card-hover"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-5`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="font-bold text-lg mb-2.5 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="max-w-3xl mx-auto pb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 md:p-12 text-center text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/20"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/20"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Siap Bergabung?
            </h2>
            <p className="text-white/80 mb-8 text-base md:text-lg max-w-lg mx-auto">
              Daftarkan diri Anda sekarang dan mulai terhubung dengan freelancer lain di seluruh Indonesia.
            </p>
            <Button asChild size="lg" className="h-14 px-10 text-base font-semibold bg-white text-foreground hover:bg-white/90 rounded-xl shadow-lg">
              <Link href="/register">
                Daftar Gratis
                <ArrowRight className="ml-2.5 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
