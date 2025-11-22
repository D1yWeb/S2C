'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { BackgroundLines } from '@/components/ui/background-lines'
import Link from 'next/link'
import { motion } from 'motion/react'

const Page = () => {
  return (
    <section className="flex h-full min-h-screen w-screen justify-center items-center py-8 sm:py-16 lg:py-32 overflow-hidden">
      <BackgroundLines className="container flex w-full flex-col items-center justify-center">
        <div className="relative z-20 flex flex-col items-center justify-center space-y-8 lg:space-y-12 text-center px-4">
          {/* Animated Welcome Title with Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.h1
              className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tighter relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Welcome
              </span>
              {/* Glow effect */}
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-primary blur-3xl opacity-30 -z-10"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.h1>
          </motion.div>

          {/* Animated Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed"
          >
            Get started with S2C and transform your sketches into beautiful, production-ready code.
          </motion.p>

          {/* Animated Button with Hover Effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 lg:mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-10 py-7 lg:px-12 lg:py-8 relative overflow-hidden group"
                >
                  <motion.span
                    className="relative z-10 flex items-center gap-2"
                    initial={{ opacity: 1 }}
                    whileHover={{ x: 2 }}
                  >
                    Get started
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block"
                      initial={{ x: 0 }}
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </motion.svg>
                  </motion.span>
                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </BackgroundLines>
    </section>
  )
}

export default Page
