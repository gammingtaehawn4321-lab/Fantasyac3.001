plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val releaseKeystorePath = System.getenv("FANTASYAC_KEYSTORE_PATH")
val releaseKeystorePassword = System.getenv("FANTASYAC_KEYSTORE_PASSWORD")
val releaseKeyAlias = System.getenv("FANTASYAC_KEY_ALIAS")
val releaseKeyPassword = System.getenv("FANTASYAC_KEY_PASSWORD")

android {
    namespace = "com.fantasyac.game"
    compileSdk = 35
    ndkVersion = "27.2.12479018"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    defaultConfig {
        applicationId = "com.fantasyac.game"
        minSdk = 28
        targetSdk = 35
        versionCode = 4000500
        versionName = "4.0.5"

        externalNativeBuild {
            cmake { cppFlags += "-std=c++17" }
        }
        ndk { abiFilters += listOf("arm64-v8a") }
    }

    signingConfigs {
        if (!releaseKeystorePath.isNullOrBlank() && file(releaseKeystorePath).exists()) {
            create("release") {
                storeFile = file(releaseKeystorePath)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    sourceSets["main"].assets.srcDir("src/main/assets")
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.webkit:webkit:1.12.1")
}
