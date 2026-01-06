<?php

namespace App\Controller\Api\Admin;

use App\Entity\User;
use App\Entity\Subject;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminUserController extends AbstractController
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher) {}

    // ===== USERS =====
    #[Route('/users', methods: ['GET'])]
    public function getUsers(EntityManagerInterface $em): JsonResponse {
        $users = $em->getRepository(User::class)->findAll();
        $data = array_map(fn($u) => [
            'id' => $u->getId(),
            'email' => $u->getEmail(),
            'role' => $u->getRoles()[0] ?? 'ROLE_USER'
        ], $users);
        return new JsonResponse($data);
    }

    #[Route('/users', methods: ['POST'])]
    public function addUser(Request $request, EntityManagerInterface $em): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email'], $data['password'], $data['role'])) {
            return new JsonResponse(['error' => 'Email, password, and role are required'], 400);
        }

        // Check if user already exists
        if ($em->getRepository(User::class)->findOneBy(['email' => $data['email']])) {
            return new JsonResponse(['error' => 'User already exists'], 400);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setRoles([$data['role']]);
        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));

        $em->persist($user);
        $em->flush();

        return new JsonResponse(['message' => 'User created', 'id' => $user->getId()]);
    }

    #[Route('/users/{id}', methods: ['PATCH'])]
    public function editUser($id, Request $request, EntityManagerInterface $em): JsonResponse {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) return new JsonResponse(['error' => 'User not found'], 404);

        $data = json_decode($request->getContent(), true);

        if (isset($data['email'])) $user->setEmail($data['email']);
        if (isset($data['role'])) $user->setRoles([$data['role']]);
        if (isset($data['password'])) $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));

        $em->flush();
        return new JsonResponse(['message' => 'User updated']);
    }

    #[Route('/users/{id}', methods: ['DELETE'])]
    public function deleteUser($id, EntityManagerInterface $em): JsonResponse {
        $user = $em->getRepository(User::class)->find($id);
        if (!$user) return new JsonResponse(['error' => 'User not found'], 404);

        $em->remove($user);
        $em->flush();
        return new JsonResponse(['message' => 'User deleted']);
    }

    // ===== SUBJECTS =====
    #[Route('/subjects', methods: ['GET'])]
    public function getSubjects(EntityManagerInterface $em): JsonResponse {
        $subjects = $em->getRepository(Subject::class)->findAll();
        $data = array_map(fn($s) => [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'image_url' => $s->getImageUrl()
        ], $subjects);
        return new JsonResponse($data);
    }

    #[Route('/subjects', methods: ['POST'])]
    public function addSubject(Request $request, EntityManagerInterface $em): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!isset($data['name'], $data['image_url'])) {
            return new JsonResponse(['error' => 'Name and image_url are required'], 400);
        }

        $subject = new Subject();
        $subject->setName($data['name']);
        $subject->setImageUrl($data['image_url']); // Make sure you have this field in Subject entity

        $em->persist($subject);
        $em->flush();

        return new JsonResponse(['message' => 'Subject added', 'id' => $subject->getId()]);
    }

    #[Route('/subjects/{id}', methods: ['PUT'])]
    public function updateSubject($id, Request $request, EntityManagerInterface $em): JsonResponse {
        $subject = $em->getRepository(Subject::class)->find($id);
        if (!$subject) return new JsonResponse(['error' => 'Subject not found'], 404);

        $data = json_decode($request->getContent(), true);
        if (isset($data['name'])) $subject->setName($data['name']);
        if (isset($data['image_url'])) $subject->setImageUrl($data['image_url']);

        $em->flush();
        return new JsonResponse(['message' => 'Subject updated']);
    }

    #[Route('/subjects/{id}', methods: ['DELETE'])]
    public function deleteSubject($id, EntityManagerInterface $em): JsonResponse {
        $subject = $em->getRepository(Subject::class)->find($id);
        if (!$subject) return new JsonResponse(['error' => 'Subject not found'], 404);

        $em->remove($subject);
        $em->flush();
        return new JsonResponse(['message' => 'Subject deleted']);
    }
}
