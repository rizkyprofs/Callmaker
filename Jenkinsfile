pipeline {
  agent any
  options { skipDefaultCheckout(true) } // biar ga double checkout

  environment {
    IMAGE_NAME     = "callmaker"
    CONTAINER_NAME = "callmaker-container"
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: 'master', url: 'https://github.com/rizkyprofs/Callmaker.git'
      }
    }

    stage('Install Dependencies') {
      steps {
        // Jalankan npm di folder yang punya package.json
        dir('frontend') { bat 'npm ci || npm install' }
        dir('backend')  { bat 'npm ci || npm install' }
      }
    }

    stage('Build Vue App') {
      steps {
        dir('frontend') { bat 'npm run build' }
        // Opsional: arsipkan hasil build supaya kelihatan di Jenkins
        bat 'if not exist dist mkdir dist'
        bat 'xcopy /E /I /Y frontend\\dist dist\\frontend'
        archiveArtifacts artifacts: 'dist/**', fingerprint: true
      }
    }

    stage('Build Docker Image') {
      steps {
        // Asumsikan Dockerfile di root dan butuh frontend/dist yang sudah dibuat
        bat 'docker build -t %IMAGE_NAME% .'
      }
    }

    stage('Run Docker Container') {
      steps {
        script {
          // Hentikan kalau ada container lama, lalu jalankan yang baru
          bat '''
          docker rm -f %CONTAINER_NAME% || ver >NUL
          docker run -d -p 8080:80 --name %CONTAINER_NAME% %IMAGE_NAME%
          '''
        }
      }
    }
  }

  post {
    success { echo '✅ Build & Deploy berhasil!' }
    failure { echo '❌ Build gagal, periksa log.' }
  }
}
