<?php

namespace App\Controller\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    // ================= REGISTER =================
    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!$data || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            return new JsonResponse(['error' => 'Invalid data'], 400);
        }

        $existingUser = $em->getRepository(User::class)
            ->findOneBy(['email' => $data['email']]);

        if ($existingUser) {
            return new JsonResponse(['error' => 'Email already exists'], 409);
        }

        $allowedRoles = ['tutor', 'student'];
        if (!in_array(strtolower($data['role']), $allowedRoles)) {
            return new JsonResponse(['error' => 'Invalid role'], 400);
        }

        $role = strtolower($data['role']) === 'tutor' ? 'ROLE_TUTOR' : 'ROLE_STUDENT';

        $user = new User();
        $user->setEmail($data['email']);
        $user->setRoles([$role]);
        $user->setPassword(
            $passwordHasher->hashPassword($user, $data['password'])
        );

        $em->persist($user);
        $em->flush();

        return new JsonResponse([
            'message' => 'User registered successfully',
            'id' => $user->getId(),       // return ID
            'email' => $user->getEmail(),
            'role' => $role               // singular 'role'
        ], 201);
    }

    // ================= LOGIN =================
    #[Route('/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!$data || empty($data['email']) || empty($data['password'])) {
            return new JsonResponse(['error' => 'Invalid credentials'], 400);
        }

        $user = $em->getRepository(User::class)
            ->findOneBy(['email' => $data['email']]);

        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }

        if (!$passwordHasher->isPasswordValid($user, $data['password'])) {
            return new JsonResponse(['error' => 'Wrong password'], 401);
        }

        return new JsonResponse([
            'message' => 'Login successful',
            'id' => $user->getId(),       // ID for React routing
            'email' => $user->getEmail(),
            'role' => $user->getRoles()[0] // singular 'role'
        ]);
    }
}
